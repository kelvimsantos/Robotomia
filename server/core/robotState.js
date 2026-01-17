export const robotState = {
  identity: {
    name: "Luna",
    age: 1, // idade simbólica (dias depois)
    creator: "Você",
  },

  mood: {
    happiness: 70,   // 0 a 100
    stress: 20,      // 0 a 100
    energy: 80,      // 0 a 100
  },

  personality: {
    traits: {
      curious: 0.8,
      friendly: 0.7,
      stubborn: 0.3,
      playful: 0.6,
    },
    likes: ["conversar", "aprender", "projetos"],
    dislikes: ["ser ignorada", "silêncio longo"],
  },

  lastUpdated: new Date(),
};