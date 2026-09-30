import prisma from "./db";

export async function getOrCreateDefaultUser() {
  const defaultEmail = "creator@sketchmesh.io";
  const defaultUsername = "architect";

  try {
    let user = await prisma.user.findUnique({
      where: { email: defaultEmail },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email: defaultEmail,
          username: defaultUsername,
          avatarUrl: "https://api.dicebear.com/7.x/bottts/svg?seed=creator",
        },
      });
    }
    return user;
  } catch (error) {
    // If DB is offline, return synthetic user session object for seamless client fallback
    return {
      id: "usr_mock_default",
      email: defaultEmail,
      username: defaultUsername,
      avatarUrl: "https://api.dicebear.com/7.x/bottts/svg?seed=creator",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }
}
