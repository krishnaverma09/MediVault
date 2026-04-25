const QRCodeService = require("../../backend/services/QRCodeService");

describe("QRCodeService", () => {
  test("generates a QR data URL for valid input", async () => {
    const service = new QRCodeService();

    const result = await service.generate("http://localhost:3001/api/public/emergency/token123");

    expect(result.startsWith("data:image/png;base64,")).toBe(true);
  });

  test("throws an error for invalid URLs", async () => {
    const service = new QRCodeService();

    await expect(service.generate(12345)).rejects.toMatchObject({
      statusCode: 400,
      message: "A valid URL is required to generate QR code",
    });
  });
});
