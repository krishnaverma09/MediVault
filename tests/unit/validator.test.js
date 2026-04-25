const Validator = require("../../backend/utils/Validator");
const Validators = require("../../backend/utils/Validators");

describe("Validator", () => {
  test("assertNonEmptyString enforces required and max length", () => {
    expect(() => Validator.assertNonEmptyString("", "fullName")).toThrow("fullName is required");
    expect(() => Validator.assertNonEmptyString("abc", "fullName", 2)).toThrow(
      "fullName exceeds allowed length"
    );
    expect(Validator.assertNonEmptyString("  Jane  ", "fullName")).toBe("Jane");
  });

  test("sanitizes and validates emergency payload", () => {
    const result = Validator.validateEmergencyPayload({
      fullName: "  Jane Doe  ",
      age: 32,
      bloodGroup: "o+",
      allergies: [" Dust ", ""],
      conditions: ["Asthma"],
      medications: ["Inhaler"],
      emergencyContacts: [
        {
          name: "  John Doe  ",
          relation: " Brother ",
          phone: " 1234567890 ",
        },
      ],
      notes: "  Carries inhaler  ",
    });

    expect(result).toEqual({
      fullName: "Jane Doe",
      age: 32,
      bloodGroup: "O+",
      allergies: ["Dust"],
      conditions: ["Asthma"],
      medications: ["Inhaler"],
      emergencyContacts: [
        {
          name: "John Doe",
          relation: "Brother",
          phone: "1234567890",
        },
      ],
      notes: "Carries inhaler",
    });
  });

  test("rejects invalid emergency token values", () => {
    expect(() => Validator.validateToken("invalid token")).toThrow("Invalid token");
  });

  test("rejects invalid boolean field", () => {
    expect(() => Validator.optionalBoolean("yes", "enabled")).toThrow("enabled must be a boolean");
  });

  test("handles optional numeric/string fields correctly", () => {
    expect(Validator.optionalAge(35)).toBe(35);
    expect(Validator.optionalAge("")).toBeNull();
    expect(() => Validator.optionalAge(200)).toThrow("age must be an integer between 0 and 130");

    expect(Validator.optionalString(undefined, "notes")).toBe("");
    expect(Validator.optionalString("  hello  ", "notes")).toBe("hello");
    expect(() => Validator.optionalString(123, "notes")).toThrow("notes must be a string");
  });

  test("validates and sanitizes list payloads", () => {
    expect(Validator.sanitizeStringArray(undefined, "allergies")).toEqual([]);
    expect(Validator.sanitizeStringArray([" Dust ", ""], "allergies")).toEqual(["Dust"]);
    expect(() => Validator.sanitizeStringArray("Dust", "allergies")).toThrow("allergies must be an array");
    expect(() => Validator.sanitizeStringArray([123], "allergies")).toThrow(
      "allergies[0] must be a string"
    );
  });

  test("validates emergency contacts shape", () => {
    expect(Validator.sanitizeEmergencyContacts(undefined)).toEqual([]);
    expect(() => Validator.sanitizeEmergencyContacts("invalid")).toThrow(
      "emergencyContacts must be an array"
    );
    expect(() => Validator.sanitizeEmergencyContacts(new Array(6).fill({}))).toThrow(
      "emergencyContacts supports at most 5 contacts"
    );
    expect(() => Validator.sanitizeEmergencyContacts([null])).toThrow("emergencyContacts[0] is invalid");
  });

  test("rejects invalid emergency payload body", () => {
    expect(() => Validator.validateEmergencyPayload(null)).toThrow("Invalid request body");
  });
});

describe("Validators", () => {
  test("parse helpers validate ranges and types", () => {
    expect(Validators.parseOptionalNumber("", "weight", 1, 400)).toBeNull();
    expect(Validators.parseOptionalNumber("73.5", "weight", 1, 400)).toBe(73.5);
    expect(() => Validators.parseOptionalNumber("abc", "weight", 1, 400)).toThrow(
      "weight must be a valid number"
    );
    expect(() => Validators.parseOptionalNumber(0, "weight", 1, 400)).toThrow(
      "weight must be at least 1"
    );

    expect(Validators.parseOptionalInteger("1200", "steps", 0, 10000)).toBe(1200);
    expect(() => Validators.parseOptionalInteger("12.5", "steps", 0, 10000)).toThrow(
      "steps must be an integer"
    );

    expect(Validators.parseOptionalString("  note ", "notes", 20)).toBe("note");
    expect(() => Validators.parseOptionalString(10, "notes")).toThrow("notes must be a string");
  });

  test("validates complete vitals payload", () => {
    const result = Validators.validateVitalsPayload({
      weight: 72.5,
      height: 175,
      bloodPressureSystolic: 120,
      bloodPressureDiastolic: 80,
      bloodSugarFasting: 95,
      heartRate: 70,
      oxygenLevel: 98,
      sleepHours: 7.5,
      steps: 8000,
      notes: "Stable",
      date: "2026-01-01",
    });

    expect(result.weight).toBe(72.5);
    expect(result.height).toBe(175);
    expect(result.steps).toBe(8000);
    expect(result.notes).toBe("Stable");
    expect(result.date instanceof Date).toBe(true);
  });

  test("requires at least one metric in non-partial mode", () => {
    expect(() => Validators.validateVitalsPayload({ notes: "only-note" })).toThrow(
      "At least one vital metric is required"
    );
  });

  test("rejects invalid body format for vitals payload", () => {
    expect(() => Validators.validateVitalsPayload([])).toThrow("Invalid request body");
  });

  test("rejects empty partial updates", () => {
    expect(() => Validators.validateVitalsPayload({}, { partial: true })).toThrow(
      "No valid fields supplied for update"
    );
  });

  test("accepts partial update with a valid field", () => {
    const result = Validators.validateVitalsPayload(
      { notes: "Updated" },
      { partial: true }
    );

    expect(result).toEqual({ notes: "Updated" });
  });

  test("validates MongoDB object id", () => {
    expect(() => Validators.validateMongoId("invalid-id", "recordId")).toThrow("recordId is invalid");
    expect(() => Validators.validateMongoId("507f191e810c19729de860ea", "recordId")).not.toThrow();
  });
});
