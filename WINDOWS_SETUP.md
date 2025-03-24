# Windows Setup Guide for Llama Recruitment Intelligence

This guide will help you set up and run the Llama Recruitment Intelligence application on your Windows system.

## Prerequisites

Before you begin, ensure you have the following installed on your Windows machine:

1. **Node.js (v18.x or higher)** - [Download from nodejs.org](https://nodejs.org/)
2. **Git** - [Download from git-scm.com](https://git-scm.com/download/win)

## Setting Up the Application

### Step 1: Clone the Repository

1. Open Command Prompt or PowerShell
2. Navigate to the directory where you want to store the project
3. Run the following command:

```bash
git clone https://github.com/samirshkumar/LlamaRecruitmentIntelligence.git
cd LlamaRecruitmentIntelligence
```

### Step 2: Install Dependencies

Run the following command to install all required dependencies:

```bash
npm install
```

This will install all necessary packages including cross-env which helps with environment variables on Windows.

### Step 3: Start the Application

You have two options to start the application:

#### Option 1: Use the provided batch file (easiest)

1. Simply double-click the `start-windows.bat` file in the project directory
2. This will automatically check for dependencies, install them if needed, and start the server

#### Option 2: Use the command line

1. Open Command Prompt or PowerShell in the project directory
2. Run the following command:

```bash
npx cross-env NODE_ENV=development tsx server/index.ts
```

### Step 4: Access the Application

Once the server is running, open your web browser and navigate to:

```
http://localhost:5000
```

## Troubleshooting

### Common Issues:

#### 1. "Module not found" errors

If you see errors about missing modules, try:

```bash
npm install
```

#### 2. Port 5000 already in use

If port 5000 is already being used by another application:

1. Stop the other application, or
2. Modify the server port in `server/index.ts` to use a different port (e.g., 3000 or 8080)

#### 3. Node.js version issues

Make sure you have Node.js v18 or higher installed:

```bash
node --version
```

If your version is lower, update to a newer version from [nodejs.org](https://nodejs.org/).

## Getting Help

If you encounter any issues that aren't covered in this guide, please:

1. Check the main `README.md` and `USER_HANDBOOK.md` for additional information
2. Create an issue on the GitHub repository
3. Contact the repository maintainer for assistance

---

© Llama Recruitment Intelligence, 2025