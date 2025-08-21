# create-springboot ⚡️

A **Node.js CLI tool** to bootstrap a new project from the [BootGuard 🛡️](https://github.com/blueisfresh/bootguard) Spring Boot template.  
It automatically clones the template, renames packages, updates configuration, and sets up profiles so you can start coding right away.

## 🚀 Features
- Interactive CLI (powered by [commander](https://www.npmjs.com/package/commander) + [inquirer](https://www.npmjs.com/package/inquirer))
- Clones the [BootGuard](https://github.com/blueisfresh/bootguard) template
- Renames Java packages (`com.blueisfresh.bootguard` → `com.<yourname>.<project>`)
- Renames main class (`BootguardApplication` → `<ProjectName>Application`)
- Renames test class (`BootguardApplicationTests` → `<ProjectName>ApplicationTests`)
- Updates `spring.profiles.active` in `application.properties`
- Deletes `resources/db` folder when using **dev** profile
- Preserves important defaults (`spring.application.name`, `jwt.secret`, `cors` config, etc.)

## 🛠️ Installation

### Local development
Clone this repo and link it globally:

```bash
git clone https://github.com/yourname/create-springboot.git
cd create-springboot
npm install
npm link
```

Now you can run:

```bash
create-springboot my-api
```

## 📦 Usage

```bash
npx create-springboot <project-name>
```

### Example

```bash
npx create-springboot my-api
```

You’ll be prompted for:
- **Spring profile** → `dev (SQLite)` or `prod (Postgres)`
- **Java package base** → e.g. your username (`xamarin` → `com.xamarin.myapi`)

## 📂 What It Does

- Clones the [BootGuard](https://github.com/blueisfresh/bootguard) template into `my-api/`
- Updates `application.properties`:
  ```properties
  spring.application.name=my-api
  spring.profiles.active=dev
  jwt.secret=...
  app.cors.allowed-origins=http://localhost:3000,http://localhost:4200
  ```
- Renames:
  - `BootguardApplication.java` → `MyapiApplication.java`
  - `BootguardApplicationTests.java` → `MyapiApplicationTests.java`
- Replaces all `com.blueisfresh.bootguard` references with `com.<yourname>.<project>`
- If **dev** profile is chosen → deletes `src/main/resources/db` folder

## 🔑 Example

```bash
npx create-springboot my-api
```

Output:

```
🚀 Creating Spring Boot project: my-api
✔ Choose a Spring profile: dev (SQLite)
✔ Enter your Java package base (e.g. your username): xamarin
📦 Template cloned!
⚙️  Set spring.profiles.active=dev in application.properties
🗑️ Deleted resources/db folder for dev profile
📂 Renamed package folder to com.xamarin.myapi
📝 Renamed main class to MyapiApplication.java
📝 Renamed test class to MyapiApplicationTests.java
✅ Project my-api is ready!
👉 cd my-api
👉 ./mvnw spring-boot:run -Dspring-boot.run.profiles=dev
```

## 📖 Related

- [BootGuard 🛡️](https://github.com/blueisfresh/bootguard) — the Spring Boot template this CLI is based on.
