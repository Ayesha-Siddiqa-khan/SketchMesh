#!/bin/bash
set -e

# Disable swap
swapoff -a
sed -i '/swap/d' /etc/fstab

# Forwarding IPv4 and letting iptables see bridged traffic
cat <<EOF | tee /etc/modules-load.d/k8s.conf
overlay
br_netfilter
EOF

modprobe overlay
modprobe br_netfilter

cat <<EOF | tee /etc/sysctl.d/k8s.conf
net.bridge.bridge-nf-call-iptables  = 1
net.bridge.bridge-nf-call-ip6tables = 1
net.ipv4.ip_forward                 = 1
EOF

sysctl --system

# Install containerd & dependencies
apt-get update -y
apt-get install -y apt-transport-https ca-certificates curl gpg containerd

mkdir -p /etc/containerd
containerd config default | tee /etc/containerd/config.toml
sed -i 's/SystemdCgroup = false/SystemdCgroup = true/g' /etc/containerd/config.toml
systemctl restart containerd
systemctl enable containerd

# Add Kubernetes official repository
mkdir -p -m 755 /etc/apt/keyrings
curl -fsSL https://pkgs.k8s.io/core:/stable:/v1.30/deb/Release.key | gpg --dearmor -o /etc/apt/keyrings/kubernetes-apt-keyring.gpg --yes
echo 'deb [signed-by=/etc/apt/keyrings/kubernetes-apt-keyring.gpg] https://pkgs.k8s.io/core:/stable:/v1.30/deb/ /' | tee /etc/apt/sources.list.d/kubernetes.list

apt-get update -y
apt-get install -y kubelet kubeadm kubectl
apt-mark hold kubelet kubeadm kubectl

# Get public IP
PUBLIC_IP=$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4 || echo "98.86.179.111")
PRIVATE_IP=$(curl -s http://169.254.169.254/latest/meta-data/local-ipv4 || echo "10.0.1.70")

# Initialize Kubernetes Control Plane with public IP in apiserver-cert-extra-sans
kubeadm init --apiserver-advertise-address=$PRIVATE_IP --apiserver-cert-extra-sans=$PUBLIC_IP,$PRIVATE_IP --pod-network-cidr=192.168.0.0/16

# Configure kubeconfig for ubuntu user and root
mkdir -p /home/ubuntu/.kube
cp -i /etc/kubernetes/admin.conf /home/ubuntu/.kube/config
chown -R ubuntu:ubuntu /home/ubuntu/.kube

mkdir -p /root/.kube
cp -i /etc/kubernetes/admin.conf /root/.kube/config

# Install Calico CNI
export KUBECONFIG=/etc/kubernetes/admin.conf
kubectl apply -f https://raw.githubusercontent.com/projectcalico/calico/v3.28.0/manifests/calico.yaml

# Generate external kubeconfig pointing to Public IP
cp /etc/kubernetes/admin.conf /etc/kubernetes/external-admin.conf
sed -i "s|https://$PRIVATE_IP:6443|https://$PUBLIC_IP:6443|g" /etc/kubernetes/external-admin.conf

echo "===KUBECONFIG_BASE64_START==="
cat /etc/kubernetes/external-admin.conf | base64 -w 0
echo ""
echo "===KUBECONFIG_BASE64_END==="
echo "===KUBECONFIG_RAW_START==="
cat /etc/kubernetes/external-admin.conf
echo ""
echo "===KUBECONFIG_RAW_END==="
