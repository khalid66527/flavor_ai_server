# FlavorAI Backend Server

This is the backend server for the **FlavorAI** recipe & meal planning platform. It is built using Node.js, Express.js, TypeScript, and MongoDB (Mongoose) with Passport Google OAuth and Gemini AI integration.

---

## Folder Structure

```text
src/
  server.ts
  config/
    db.ts            # Mongoose database connector
    env.ts            # Centralized Zod environment variables validator
    passport.ts       # Passport Google OAuth Strategy configuration
  models/
    User.ts           # Mongoose User schema & password hashing
    Recipe.ts         # Mongoose Recipe & Reviews schemas
    ChatHistory.ts    # Mongoose chat log schema
  middleware/
    auth.middleware.ts    # Auth guard (protect, optionalProtect)
    error.middleware.ts   # Global error handling format
    validate.middleware.ts# Zod request validators
  controllers/
    auth.controller.ts
    recipe.controller.ts
    ai.controller.ts
    user.controller.ts
  routes/
    auth.routes.ts
    recipe.routes.ts
    ai.routes.ts
    user.routes.ts
  services/
    ai.service.ts              # Gemini AI interface for recipe generation/chat
    recommendation.service.ts  # Personalized recipe generator using AI + database matching
  utils/
    jwt.ts            # Token signing utilities
    prompts.ts        # Gemini System prompts
    apiResponse.ts    # Response format wrappers
  seed.ts             # Seeding script
```

---

## Setup Instructions

### 1. Prerequisites
- Node.js (v18 or higher)
- MongoDB Connection String (Atlas or Local)
- Gemini API Key

### 2. Environment Variables (.env)
Create a `.env` file in the root of the server directory:
```env
PORT=5000
MONGO_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/flavor_ai?appName=Cluster0
JWT_SECRET=your_jwt_signing_key_here
GOOGLE_CLIENT_ID=your_google_oauth_client_id
GOOGLE_CLIENT_SECRET=your_google_oauth_client_secret
GEMINI_API_KEY=your_gemini_generative_ai_api_key
```

### 3. Install Dependencies
Run the following command to install packages:
```bash
npm install
```

### 4. Database Seeding
To seed the database with a test user (`demo@flavorai.com` / `Demo@123`) and 10 realistic recipes, run:
```bash
# Compile and seed
npm run build
node dist/seed.js
```
*Note: You can run seeding with the placeholder key in `.env` without a real `GEMINI_API_KEY`!*

### 5. Running the Server

#### Development Mode (HMR)
```bash
npm run dev
```

#### Production Build & Start
```bash
npm run build
npm start
```

---

## API Routes Documentation

### 🔑 Authentication (`/api/auth`)
- `POST /register`: Registers a new user. Returns JWT and user profile.
- `POST /login`: Validates user password and email. Returns JWT.
- `GET /me` *(Protected)*: Returns the current logged-in user profile.
- `GET /demo-login`: Logs in as the pre-seeded demo user (`demo@flavorai.com`).
- `GET /google`: Redirects to Google OAuth page.
- `GET /google/callback`: Handle OAuth callback, generates JWT, and redirects to frontend.

### 🍳 Recipes (`/api/recipes`)
- `GET /`: List recipes. Query filters: `search`, `category`, `cuisine`, `dietType`, `sort` (rating|newest|cookTime), `page`, `limit`.
- `GET /:id`: Get specific recipe by ID (populates reviews and lists 4 related category recipes).
- `POST /` *(Protected)*: Create a new custom recipe.
- `PUT /:id` *(Protected)*: Edit your own recipe.
- `DELETE /:id` *(Protected)*: Delete your own recipe.
- `GET /user/mine` *(Protected)*: List recipes created by you.
- `POST /:id/reviews` *(Protected)*: Add a rating (1-5) and review comment. Recalculates average ratings automatically.

### 🧠 Gemini AI Services (`/api/ai`)
*Rate limited to 20 requests per 10 minutes.*
- `POST /generate-recipe`: Inputs ingredients, cuisine, and dietType. Prompts Gemini to return a clean, strictly formatted Recipe JSON block without committing it to the database.
- `POST /regenerate`: Same as above with slightly varied temperature settings.
- `POST /chat` *(Optional Auth)*: Multi-turn Chatbot (Chef AI) using chunked streaming transfer encoding. If authenticated, logs the session to your Mongoose database chat logs.
- `GET /recommendations` *(Protected)*: Runs a recommendation algorithm combining your dietary preferences, allergies, and recent interaction logs via Gemini to query matching database recipes (limit 8).

### 👤 User Services (`/api/users`)
- `GET /preferences` *(Protected)*: Get dietary preferences.
- `PUT /preferences` *(Protected)*: Set dietType, allergies, and cuisines.
- `GET /saved` *(Protected)*: List all saved/favorited recipes.
- `POST /save` *(Protected)*: Add a recipe to your saved list.
- `POST /unsave` *(Protected)*: Remove a recipe from your saved list.
