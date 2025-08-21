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

    // Step 3: Update spring.profiles.active in application.properties
    const appPropsPath = path.join(
      projectName,
      "src/main/resources/application.properties"
    );

    let appProps = fs.readFileSync(appPropsPath, "utf-8");

    // Replace the spring.profiles.active line
    if (appProps.includes("spring.profiles.active=")) {
      appProps = appProps.replace(
        /spring\.profiles\.active=.*/,
        `spring.profiles.active=${profile}`
      );
    } else {
      // If not present, append it
      appProps += `\nspring.profiles.active=${profile}\n`;
    }

    fs.writeFileSync(appPropsPath, appProps);
    console.log(
      `⚙️  Set spring.profiles.active=${profile} in application.properties`
    );

    // Step 3b: If dev profile, delete resources/db folder
    if (profile === "dev") {
      const dbFolder = path.join(projectName, "src/main/resources/db");
      if (fs.existsSync(dbFolder)) {
        fs.rmSync(dbFolder, { recursive: true, force: true });
        console.log("🗑️ Deleted resources/db folder for dev profile");
      }
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

    // Step 5b: Rename Java test package folder
    const oldTestPackagePath = path.join(
      projectName,
      "src/test/java/com/blueisfresh/bootguard"
    );
    const newTestPackagePath = path.join(
      projectName,
      `src/test/java/com/${packageBase}/${sanitizedName}`
    );

    // Ensure parent dirs exist
    fs.mkdirSync(path.dirname(newTestPackagePath), { recursive: true });

    // Move the folder
    if (fs.existsSync(oldTestPackagePath)) {
      fs.renameSync(oldTestPackagePath, newTestPackagePath);
      console.log(
        `📂 Renamed test package folder to com.${packageBase}.${sanitizedName}`
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

    // Step 6b: Delete old com/blueisfresh test folder
    const oldTestBasePath = path.join(
      projectName,
      "src/test/java/com/blueisfresh"
    );
    if (fs.existsSync(oldTestBasePath)) {
      try {
        fs.rmSync(oldTestBasePath, { recursive: true, force: true });
        console.log("🧹 Removed old com.blueisfresh test package completely");
      } catch (err) {
        console.error(
          "⚠️ Failed to remove old com.blueisfresh test folder:",
          err
        );
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

    // Step 8: Rename BootguardApplication.java
    const oldMainFile = path.join(
      projectName,
      `src/main/java/com/${packageBase}/${sanitizedName}/BootguardApplication.java`
    );
    const newMainFile = path.join(
      projectName,
      `src/main/java/com/${packageBase}/${sanitizedName}/${capitalize(
        sanitizedName
      )}Application.java`
    );

    if (fs.existsSync(oldMainFile)) {
      let content = fs.readFileSync(oldMainFile, "utf-8");

      // Replace class name
      content = content.replace(
        /public class BootguardApplication/,
        `public class ${capitalize(sanitizedName)}Application`
      );

      // Replace SpringApplication.run reference
      content = content.replace(
        /SpringApplication\.run\(BootguardApplication\.class, args\);/,
        `SpringApplication.run(${capitalize(
          sanitizedName
        )}Application.class, args);`
      );

      fs.writeFileSync(oldMainFile, content);

      fs.renameSync(oldMainFile, newMainFile);
      console.log(
        `📝 Renamed main class to ${capitalize(sanitizedName)}Application.java`
      );
    }

    // Step 9: Rename BootguardApplicationTests.java
    const oldTestFile = path.join(
      projectName,
      `src/test/java/com/${packageBase}/${sanitizedName}/BootguardApplicationTests.java`
    );
    const newTestFile = path.join(
      projectName,
      `src/test/java/com/${packageBase}/${sanitizedName}/${capitalize(
        sanitizedName
      )}ApplicationTests.java`
    );

    if (fs.existsSync(oldTestFile)) {
      let testContent = fs.readFileSync(oldTestFile, "utf-8");
      // Replace class name inside the test file
      testContent = testContent
        .replace(
          /public class BootguardApplicationTests/,
          `public class ${capitalize(sanitizedName)}ApplicationTests`
        )
        .replace(
          /BootguardApplication\.class/,
          `${capitalize(sanitizedName)}Application.class`
        );
      fs.writeFileSync(oldTestFile, testContent);

      fs.renameSync(oldTestFile, newTestFile);
      console.log(
        `📝 Renamed test class to ${capitalize(
          sanitizedName
        )}ApplicationTests.java`
      );
    }

    console.log(`✅ Project ${projectName} is ready!`);
    console.log(`👉 cd ${projectName}`);
    console.log(
      `👉 ./mvnw spring-boot:run -Dspring-boot.run.profiles=${profile}`
    );
  }); // <-- closes .action

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

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
