
# Maximo Version Portal

This is a Next.js application designed as a portal for managing IBM Maximo Application Suite versioning, tickets, deployments, and related development activities. It provides role-based access for clients, technicians (admins), and superusers.

## About This Project

The Maximo Version Portal aims to streamline the development and deployment lifecycle for Maximo configurations and customizations. It facilitates communication between clients and technical teams, tracks changes through version control, and provides insights through analytics.

## Tech Stack

*   **Framework:** Next.js (App Router)
*   **Language:** TypeScript
*   **UI:** React, ShadCN UI Components
*   **Styling:** Tailwind CSS
*   **Generative AI:** Genkit (for AI-powered features, if implemented)
*   **Authentication:** Mocked (Context API based)
*   **Data Persistence:** Mocked (Firebase Firestore with LocalStorage fallback)

## Key Features

*   **Role-Based Access Control:** Different dashboards and functionalities for Clients, Admins/Technicians, and Superusers.
*   **Ticket Management:**
    *   Clients can create and view their tickets.
    *   Admins/Superusers can view all tickets, assign them, and update their status/priority/type.
*   **GitHub Integration (Mocked):** View commits associated with tickets.
*   **Maximo Configuration Management:** Upload Maximo configurations (scripts, XMLs).
*   **File Management:** Upload, download, and view version history of configuration files.
*   **Deployment Logging:** Record and view deployment history.
*   **Audit Logging:** Track system activities, changes, and deployments.
*   **User Management (Superuser):** Create and manage user accounts and organizations.
*   **Organization Management (Superuser):** Manage organizations and their linked GitHub repositories.
*   **Analytics (Superuser):** View metrics on tickets, commits, deployments, and team activity.
*   **Profile Management:** Users can view their profile information.
*   **Contextual Collaboration:** Commenting system within tickets.

## Getting Started (General Development)

This project is set up to run within Firebase Studio. For local development outside of this specific environment, you would typically follow these steps:

### Prerequisites

*   Node.js (version 18.x or later recommended)
*   npm or yarn

### Installation

1.  **Clone the repository (if applicable):**
    ```bash
    git clone <repository-url>
    cd <project-directory>
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    # or
    yarn install
    ```

3.  **Environment Variables:**
    Create a `.env.local` file in the root of your project and add any necessary environment variables. For Firebase, these typically include:
    ```env
    NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
    NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
    NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
    ```
    *(Note: For this mocked version, if `NEXT_PUBLIC_FIREBASE_PROJECT_ID` is not set or invalid, the application will use LocalStorage for data persistence.)*

### Running the Development Server

To run the app in development mode:

```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:9002](http://localhost:9002) (or the port specified in `package.json`) with your browser to see the result.

### Building for Production

To build the application for production:

```bash
npm run build
# or
yarn build
```

This will create an optimized build in the `.next` folder.

## Available Scripts

*   `dev`: Runs the Next.js development server (with Turbopack).
*   `genkit:dev`: Starts the Genkit development server.
*   `genkit:watch`: Starts the Genkit development server with watch mode.
*   `build`: Builds the Next.js application for production.
*   `start`: Starts the Next.js production server.
*   `lint`: Runs ESLint.
*   `typecheck`: Runs TypeScript type checking.

## Project Structure

*   `src/app/`: Contains the Next.js App Router pages and layouts.
    *   `(app)/`: Authenticated routes and layouts.
    *   `login/`: Login page.
    *   `actions/`: Server Actions.
*   `src/components/`: Reusable UI components, categorized by feature (e.g., `tickets`, `layout`, `ui`).
*   `src/context/`: React Context providers (e.g., `AuthContext`).
*   `src/hooks/`: Custom React Hooks.
*   `src/lib/`: Utility functions and Firebase configuration.
*   `src/services/`: Mocked data services for interacting with "backend" resources (e.g., tickets, users, GitHub).
*   `src/ai/`: Genkit related files for AI functionalities.
    *   `flows/`: Genkit flows.
*   `public/`: Static assets.

## Further Information

This README provides a basic overview. For more detailed information on specific components or features, please refer to the code and comments within the respective files.
```