const fs = require("fs");
const path = require("path");

class EnvLoader {
  static parseLine(line) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      return null;
    }

    const equalsIndex = trimmed.indexOf("=");
    if (equalsIndex === -1) {
      return null;
    }

    const key = trimmed.slice(0, equalsIndex).trim();
    let value = trimmed.slice(equalsIndex + 1).trim();

    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }

    if (!key) {
      return null;
    }

    return { key, value };
  }

  static load(envFilePath = path.resolve(__dirname, "../../.env.test")) {
    if (!fs.existsSync(envFilePath)) {
      return;
    }

    const fileContent = fs.readFileSync(envFilePath, "utf8");
    const lines = fileContent.split(/\r?\n/);

    lines.forEach((line) => {
      const parsed = this.parseLine(line);
      if (!parsed) {
        return;
      }

      if (process.env[parsed.key] === undefined) {
        process.env[parsed.key] = parsed.value;
      }
    });
  }
}

module.exports = EnvLoader;
