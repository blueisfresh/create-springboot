#!/usr/bin/env node
import { Command } from "commander";
import inquirer from "inquirer";
import degit from "degit";
import fs from "fs";
import path from "path";

const program = new Command();

program
  .name("create-springboot")
  .description(
    "CLI to bootstrap a Spring Boot project with JWT, roles, refresh tokens"
  )
  .version("1.0.0");

program
  .argument("<project-name>", "Name of your new project")
  .action(async (projectName) => {
    console.log(`🚀 Creating Spring Boot project: ${projectName}`);

    const sanitizedName = sanitizeForPackage(projectName);

    // Step 1: Ask for profile + package base
    const { profile, packageBase } = await inquirer.prompt([
      {
        type: "list",
        name: "profile",
        message: "Choose a Spring profile:",
        choices: [
          { name: "dev (SQLite)", value: "dev" },
          { name: "prod (Postgres)", value: "prod" },
        ],
        default: "dev",
      },
      {
        type: "input",
        name: "packageBase",
        message: "Enter your Java package base (e.g. your username):",
        validate: (input) =>
          /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(input) ||
          "Package base must be a valid Java identifier",
      },
    ]);

    // Step 2: Clone template repo
    const repo = "blueisfresh/bootguard"; // 👈 your GitHub repo
    const emitter = degit(repo, { cache: false, force: true });
    await emitter.clone(projectName);

    console.log("📦 Template cloned!");

    // Step 3: Copy correct profile config
    const appPropsPath = path.join(
      projectName,
      "src/main/resources/application.properties"
    );
    const profileFile = `application-${profile}.properties`;
    const profilePath = path.join(
      projectName,
      "src/main/resources",
      profileFile
    );

    if (fs.existsSync(profilePath)) {
      fs.copyFileSync(profilePath, appPropsPath);
      console.log(`⚙️  Applied profile: ${profile}`);
    } else {
      console.warn(`⚠️ Profile file not found: ${profileFile}`);
    }

    // Step 4: Replace everywhere
    // Replace bootguard with sanitized project name in Java packages
    replaceInFiles(projectName, "bootguard", sanitizedName);

    // Replace blueisfresh with packageBase
    replaceInFiles(projectName, "blueisfresh", packageBase);

    // Replace bootguard with projectName in configs/docs
    replaceInFiles(projectName, "bootguard", projectName);

    // Step 5: Rename Java package folder
    const oldPackagePath = path.join(
      projectName,
      "src/main/java/com/blueisfresh/bootguard"
    );
    const newPackagePath = path.join(
      projectName,
      `src/main/java/com/${packageBase}/${sanitizedName}`
    );

    // Ensure parent dirs exist
    fs.mkdirSync(path.dirname(newPackagePath), { recursive: true });

    // Move the folder
    if (fs.existsSync(oldPackagePath)) {
      fs.renameSync(oldPackagePath, newPackagePath);
      console.log(
        `📂 Renamed package folder to com.${packageBase}.${sanitizedName}`
      );
    }

    // Step 6: Delete old com/blueisfresh folder (force remove everything)
    const oldBasePath = path.join(projectName, "src/main/java/com/blueisfresh");
    if (fs.existsSync(oldBasePath)) {
      try {
        fs.rmSync(oldBasePath, { recursive: true, force: true });
        console.log("🧹 Removed old com.blueisfresh package completely");
      } catch (err) {
        console.error("⚠️ Failed to remove old com.blueisfresh folder:", err);
      }
    }

    // Step 7: Replace package declarations in files
    replaceInFiles(
      projectName,
      "com.blueisfresh.bootguard",
      `com.${packageBase}.${sanitizedName}`
    );

    replaceInFiles(
      projectName,
      "<groupId>com.blueisfresh</groupId>",
      `<groupId>com.${packageBase}</groupId>`
    );

    console.log(`✅ Project ${projectName} is ready!`);
    console.log(`👉 cd ${projectName}`);
    console.log(
      `👉 ./mvnw spring-boot:run -Dspring-boot.run.profiles=${profile}`
    );
  });

program.parse();

function replaceInFiles(dir, search, replace) {
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      replaceInFiles(filePath, search, replace);
    } else {
      // Skip binary files
      if (/\.(png|jpg|jpeg|gif|ico|jar|class|db)$/i.test(file)) {
        continue;
      }

      let content = fs.readFileSync(filePath, "utf-8");

      if (content.includes(search)) {
        const updated = content.replace(new RegExp(search, "g"), replace);
        fs.writeFileSync(filePath, updated);
        console.log(`🔄 Replaced in: ${filePath}`);
      }
    }
  }
}

function sanitizeForPackage(name) {
  return name.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
}
