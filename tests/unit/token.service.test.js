const TokenService = require("../../backend/services/TokenService");

describe("TokenService", () => {
  test("returns a non-colliding token", async () => {
    const repository = {
      existsByToken: jest.fn().mockResolvedValueOnce(true).mockResolvedValueOnce(false),
    };

    const service = new TokenService(repository);
    jest
      .spyOn(service, "generateSecureToken")
      .mockReturnValueOnce("collision")
      .mockReturnValueOnce("unique-token");

    const token = await service.generateUniqueToken(3);

    expect(repository.existsByToken).toHaveBeenNthCalledWith(1, "collision");
    expect(repository.existsByToken).toHaveBeenNthCalledWith(2, "unique-token");
    expect(token).toBe("unique-token");
  });

  test("throws when unable to generate a unique token", async () => {
    const repository = {
      existsByToken: jest.fn().mockResolvedValue(true),
    };

    const service = new TokenService(repository);
    jest.spyOn(service, "generateSecureToken").mockReturnValue("always-collision");

    await expect(service.generateUniqueToken(2)).rejects.toMatchObject({
      statusCode: 500,
      message: "Could not generate a unique emergency token",
    });
  });
});
