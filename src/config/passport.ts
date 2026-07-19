import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { env } from "./env";
import { User } from "../models/User";

if (env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: env.GOOGLE_CLIENT_ID,
        clientSecret: env.GOOGLE_CLIENT_SECRET,
        callbackURL: "/api/auth/google/callback",
        proxy: true,
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0]?.value;
          if (!email) {
            return done(new Error("No email found in Google profile"), undefined);
          }

          // Check if user exists
          let user = await User.findOne({
            $or: [{ googleId: profile.id }, { email }],
          });

          if (user) {
            // Update googleId if not present
            if (!user.googleId) {
              user.googleId = profile.id;
              if (profile.photos?.[0]?.value && !user.avatar) {
                user.avatar = profile.photos[0].value;
              }
              await user.save();
            }
            return done(null, user);
          }

          // Create new user
          user = await User.create({
            name: profile.displayName || profile.name?.givenName || "Google User",
            email: email,
            googleId: profile.id,
            avatar: profile.photos?.[0]?.value || "",
            preferences: {
              dietType: "None",
              allergies: [],
              favoriteCuisines: [],
            },
          });

          return done(null, user);
        } catch (error: any) {
          return done(error, undefined);
        }
      }
    )
  );
}

// Passport serialization
passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});
