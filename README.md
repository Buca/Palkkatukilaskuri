
## Setting up and Running the Palkkatukilaskuri Application

These instructions provide a detailed guide on how to set up and run the Palkkatukilaskuri application. Please follow these steps carefully.

**Prerequisites:**

1. **PostgreSQL Installation:** Ensure you have PostgreSQL installed on your system. You can download the appropriate installer for your operating system from the official PostgreSQL website: [https://www.postgresql.org/download/](https://www.google.com/url?sa=E&source=gmail&q=https://www.postgresql.org/download/)

2. **Database Creation:** Create a database named `Palkkatukilaskuri` in your PostgreSQL instance. You can use a tool like pgAdmin (which is often included with PostgreSQL installations) or the `psql` command-line utility. Here's an example using `psql`:

    ```bash
    psql -U postgres  // Log in as the postgres user (you'll be prompted for the password)
    CREATE DATABASE Palkkatukilaskuri;
    \q // Exit psql
    ```

    Make sure the user you'll be using to connect to the database (specified in your `.env` file) has the necessary permissions to access this database.

**Steps:**

1. **Navigate to the `app` directory:**

    Open your terminal or command prompt and navigate to the `app` directory of your Palkkatukilaskuri project. Use the `cd` command:

    ```bash
    cd C:\Code\Palkkatukilaskuri\app  // Replace with your actual path
    ```

2. **Install Dependencies:**

    Once you are in the `app` directory, run the following command to install the project's dependencies:

    ```bash
    npm install
    ```

    This command will read the `package.json` file in the `app` directory and install all the required packages (including `ejs`, `express`, `pg`, etc.) into a `node_modules` folder within the `app` directory. **This step is crucial and must be completed before you can run the application.**

3. **Configure Environment Variables:**

    * **Create `.env` file (if it doesn't exist):** If you don't have a `.env` file in the `app` directory, create one.

    * **Edit `.env` file:** Open the `.env` file in a text editor and make sure it contains the correct values for your environment. Here's a breakdown of the variables and what they mean:

        ```
        SERVER_PORT=3000        // The port your application will listen on (default is 3000)
        SESSION_KEY=79c5b84835884e8d51af2f02177fd0ae984a54e0c58179c9656324daeedb4c65d62c3633b7f18dee19af0a260584d67c7292592486985e2a9d3adc4cce01ceae // A long, random secret for sessions (IMPORTANT - change this in production!)
        NODE_ENV=development      // Set to 'production' in your production environment

        DB_HOST=localhost       // The hostname of your PostgreSQL server
        DB_PORT=5432            // The port PostgreSQL is listening on (default is 5432)
        DB_USER=postgres        // The username to connect to the database
        DB_PASSWORD=postgres    // The password for the database user
        DB_NAME=Palkkatukilaskuri // The name of the database you created

        CLIENT_USERNAME=admin   // The default username for the application
        CLIENT_HASHED_PASSWORD=admin123  // The default *hashed* password - ideally, you would hash this before storing it.
        ```

        **Important Security Notes:**

        * **`SESSION_KEY`:** In a production environment, you *must* change the `SESSION_KEY` to a long, randomly generated string. Do not use the example key. You can generate a strong key using the Node.js `crypto` module or a password manager.
        * **`DB_PASSWORD`:** Do not hardcode database passwords directly in your `.env` file if possible. Use environment variables provided by your hosting platform in production.
        * **`CLIENT_HASHED_PASSWORD`:** In a real application, you should *hash* the client password before storing it. Do not store passwords in plain text.

4. **Run the Application:**

    From the *same* `app` directory, run the following command:

    ```bash
    npm start
    ```

    This will execute the `start` script defined in your `package.json` file, which is `node server.js`. Your application should now be running on the port specified in your `.env` file (default is 3000). You can access it in your browser at `http://localhost:3000` (or the appropriate address and port).

**Troubleshooting:**

* **Errors:** If you encounter any errors, carefully read the error messages in your terminal. They usually provide clues about the problem. Copy and paste the full error message if you need help.
* **Port in use:** If you get an error that the port is already in use, change the `SERVER_PORT` in your `.env` file to a different port.
* **Database connection:** Double-check that the database credentials in your `.env` file are correct and that the PostgreSQL server is running.
* **Missing dependencies:** If you get "module not found" errors, make sure you have run `npm install` in the `app` directory.