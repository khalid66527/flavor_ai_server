import mongoose from "mongoose";
import { User, Recipe, env } from "./app";

const recipesData = [
  {
    title: "Artisan AI Pizza",
    shortDescription: "A revolutionary gluten-free Neapolitan pizza with airy crust, cashew cream, and heirloom tomatoes.",
    fullDescription: "Developed using proprietary culinary intelligence algorithms, this pizza boasts a pre-fermented gluten-free flour base that rises into a charred, bubbly crust. Topped with a silky, home-blended cashew cream cheese, fresh heirloom tomato slices, and organic basil, it redefines vegan and gluten-free baking.",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuCBEu2XVyfWd2tQesn-_hbOla7W3iarDWftTFhCfSpxXiJvLap_XPpH9o_NCI79gwV5nXJWcoWoLTy7MsZM0I9dZ6Z5JudBm0gHgvWO4W-QoE6gxaKH05GP4EoyxrNgm6SgSe2naRYC7TevPPZjOMa2CQmlXsyr2IrGcEmzg4Da_PEWcNzjnoaFxzGscUaqk56ZmO6onoP0SdraXNH2r_-sMl0XRgSHakySSyEATTyiC7eGebA3ByMp_-0nSB0zBJs0TOsRLItGOChi",
    images: [
      "https://lh3.googleusercontent.com/aida-public/AB6AXuC0CnCxHHVZuGINKNRxOvKKVhqlB8BAEPMST77a0-u1kRKI_-aYxgFpTr7RXrdhW48rbeVjmn9ijNPO5sne7jsz_84P4hHNsYb34H_LVHTKQwziOepsvcSJvA2vNfhD43BwdgznZ3QTo1x3h5-3B3UTTTdgadegYMAUHLBewk9Dwi9kj1mBG702TjOJrdlBZ0krw5HZ6VGzwEHVaIBNq9E3EmTafhhZ_qnilMNKbBrDgAxCHt7dIQJxOC1945jkejLMzF1E-uL-13EZ",
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCqtMTwC1qzLSf4OSiu9nXUC-iV0Ff_QXHDo-SZ3Un5hPPEgQMHwigZbCHL5W8GQDryQ94QkGTyhLTJhwoCm_oWGlmag8W4dyHxjtsEn3hnY8oT6LfPKrfT7XqXkub3qpp6lQ2fOSIdCOniwNUxy-So9sg_SacRQ8wcB11Rvf4PStiiudvkjKNhpnPOo16meaGEqv3OE1XnOrzMgl6-TZSsDOJGe_zIpj8oyGEYUS0CsMIUYAOffv53tmXAKke24o_xHrhW-8ATl4Jk"
    ],
    ingredients: [
      { name: "Gluten-free pizza flour blend", quantity: "2 cups" },
      { name: "Instant yeast", quantity: "1 1/2 tsp" },
      { name: "Extra virgin olive oil", quantity: "1 tbsp" },
      { name: "Warm filtered water", quantity: "3/4 cup" },
      { name: "Cashew cream cheese", quantity: "1/2 cup" },
      { name: "Fresh heirloom tomatoes, sliced", quantity: "1 cup" },
      { name: "Fresh basil leaves", quantity: "1/2 cup" }
    ],
    steps: [
      "In a bowl, mix warm water, yeast, and olive oil. Let stand for 5 minutes until froamy.",
      "Gradually add the gluten-free flour and stir until a smooth dough forms.",
      "Cover and let the dough rise in a warm spot (82°F) for 60 minutes.",
      "Preheat oven with pizza stone to 450°F. Roll out dough, garnish with cashew cream and tomato slices, and bake for 12-15 minutes."
    ],
    cookTime: 45,
    servings: 4,
    cuisine: "Italian",
    category: "Dinner",
    dietType: "Gluten-Free",
    price: 2,
    rating: 4.8,
    ratingCount: 1,
    aiGenerated: false
  },
  {
    title: "Pan-Seared Salmon with Couscous",
    shortDescription: "Elegant pan-seared salmon served on fluffy lemon-herb couscous and crispy asparagus.",
    fullDescription: "A perfectly balanced, nutrient-rich Mediterranean dinner featuring crisp-skinned salmon fillets paired with a lemon-herb-infused couscous and charred asparagus spears. Ready in under 30 minutes, it's both healthy and upscale.",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuCKO07R78eRYQR-nTOOr_F_-0cKHzsTEgwCQomwSqbvbbn7g9tB5-iWyxl312RkNp33IKwRbozdUNnBCrdfURYHPLH1afNCoKPwg8Vu2QjNCtCvZ8opxs0AtDwVFYFVZ9FD9uWKw_r8iKXxNQCljzFEpXqhgnHip4kBvikStfgm4HGNXtQkcNHF8ZPHsQPwqjomsf5hIcNVxWYQoG3OBo97Xq-cRbL3C577pGfmYf-GRg3RRcTujJih4LCZq1Uyen2FHmRyB3hTuFPF",
    images: [],
    ingredients: [
      { name: "Fresh salmon fillets", quantity: "2 units (6oz each)" },
      { name: "Couscous", quantity: "1 cup" },
      { name: "Fresh asparagus bunch", quantity: "1 unit" },
      { name: "Lemon", quantity: "1 unit" },
      { name: "Fresh parsley, chopped", quantity: "1/4 cup" },
      { name: "Olive oil", quantity: "2 tbsp" },
      { name: "Garlic, minced", quantity: "2 cloves" }
    ],
    steps: [
      "Prepare couscous by pouring boiling water or stock over it, cover, and let steam for 5 minutes.",
      "Season salmon fillets with salt, pepper, and lemon zest.",
      "Heat olive oil in a skillet over medium-high heat. Sear salmon skin-side down for 4 minutes, flip and cook for another 3 minutes.",
      "Toss asparagus with olive oil and garlic, then roast or pan-fry until bright green and slightly charred.",
      "Fluff couscous with a fork, mix in fresh parsley, and serve salmon on top."
    ],
    cookTime: 25,
    servings: 2,
    cuisine: "French",
    category: "Dinner",
    dietType: "None",
    price: 3,
    rating: 4.9,
    ratingCount: 1,
    aiGenerated: false
  },
  {
    title: "Avocado Pesto Fusilli",
    shortDescription: "Creamy, vibrant avocado pesto tossed with al dente fusilli and toasted pine nuts.",
    fullDescription: "This recipe replaces heavy cream with ripe avocados to create a rich, heart-healthy pesto sauce. Blended with fresh basil, garlic, lemon, and olive oil, it coats al dente fusilli perfectly. Garnished with toasted pine nuts for a nutty crunch.",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuA6PXqg0LkHyiaBNZTqgYLbj_XFRzdCu13xURf7Pcy_PsJThnQeqotv623-IhrZQqcqJ6GimbC5GMcGTnSlgy8Oex9o3qzdXe7ifJfA6mjH7vO9FbKVyyJdvB5YV-Ba7zxlzg_r8lI_DJAEa6X7u4CUbc5057d6dmzGTepkHgCkRyYnFl4ltBOgj2w3WXWL_KfecBrrBChIr-d8u7TnLgC_txkqFeUyHMOn8v4u1jgE-sF8rl502Q-ghedxJRFmXtAJxwjCrI1jODLq",
    images: [],
    ingredients: [
      { name: "Fusilli pasta", quantity: "12 oz" },
      { name: "Ripe avocados", quantity: "2 units" },
      { name: "Fresh basil leaves", quantity: "1 cup" },
      { name: "Pine nuts, toasted", quantity: "1/4 cup" },
      { name: "Garlic cloves", quantity: "2 units" },
      { name: "Lemon juice", quantity: "2 tbsp" },
      { name: "Extra virgin olive oil", quantity: "1/3 cup" }
    ],
    steps: [
      "Cook fusilli in salted boiling water until al dente.",
      "In a food processor, blend avocado flesh, basil leaves, garlic, pine nuts, lemon juice, and olive oil until completely smooth.",
      "Drain pasta, reserving 1/2 cup of pasta cooking water.",
      "Toss the pasta with the avocado pesto, adding a splash of cooking water if needed to loosen the sauce. Garnish with additional pine nuts."
    ],
    cookTime: 15,
    servings: 3,
    cuisine: "Italian",
    category: "Lunch",
    dietType: "Vegetarian",
    price: 1,
    rating: 4.7,
    ratingCount: 1,
    aiGenerated: false
  },
  {
    title: "Quinoa Power Bowl",
    shortDescription: "A protein-packed Mediterranean quinoa bowl with crispy chickpeas, olives, and tahini.",
    fullDescription: "Designed for active lifestyles, this grain bowl combines a base of fluffy quinoa with roasted crispy chickpeas, fresh cucumber ribbons, kalamata olives, and cherry tomatoes. Finished with a drizzle of rich, garlicky tahini dressing.",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuD7IuLnTz-gtP8bnGmTJK8df57SO7t5DZQLHIdhzmOVI1AXQzEBrsawBEo1LdPiWP7g2HSCqf7oP3vAVthAxsdvhDTFdwglhwpeOuR8keGAFPbCRXnofAVduCwBrrGI1HjzlIhbIwVS4lPP7L9wOhUAdNqsoOgjls0MXPTUEnpdWbISpK-jUUShgdB28xzflUt07stkH9J_sZ-qu9odMWYcXL6XNV4nq-HsWa3VgOms3VecE9SNwYI10MZAim9SgLDPGnpYBd5Pteq_",
    images: [],
    ingredients: [
      { name: "Quinoa", quantity: "1 cup" },
      { name: "Canned chickpeas, drained", quantity: "1 can" },
      { name: "Cucumber", quantity: "1 unit" },
      { name: "Kalamata olives, halved", quantity: "1/2 cup" },
      { name: "Cherry tomatoes, halved", quantity: "1 cup" },
      { name: "Tahini paste", quantity: "3 tbsp" },
      { name: "Lemon juice", quantity: "2 tbsp" }
    ],
    steps: [
      "Rinse and cook quinoa according to package instructions.",
      "Toss chickpeas with olive oil, cumin, paprika, and salt. Bake at 400°F for 20 minutes until crispy.",
      "Slice cucumber into thin ribbons and prep tomatoes and olives.",
      "Whisk tahini, lemon juice, minced garlic, and a splash of warm water to create a smooth dressing.",
      "Assemble bowls with a base of quinoa, topped with chickpeas, veggies, and tahini dressing."
    ],
    cookTime: 25,
    servings: 2,
    cuisine: "Greek",
    category: "Lunch",
    dietType: "Vegan",
    price: 2,
    rating: 4.8,
    ratingCount: 1,
    aiGenerated: false
  },
  {
    title: "Butternut Squash Silk Soup",
    shortDescription: "A smooth, velvety roasted butternut squash soup swirled with creamy coconut milk.",
    fullDescription: "A comforting autumn soup crafted by roasting sweet butternut squash, garlic, and onions, then puréeing them with warm vegetable stock and nutmeg. Finished with toasted pumpkin seeds for contrast.",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuAgc8tOsrSh9tc1ElA1geJhm2CsqbKXYI-qTjd3PxZsxPgrcUscaZ23Jgzuqr7UROQ7lh9FGHi-1O2rQ5PCYErTu7BlaQr69H7LSYlYQyyxszHOznXGTYthnd_reDaTE2_Sc1tTbLWunE75xXU2PbrOENIvJndgx1MjjZvO7_J6FYnsnfy_xEIpsTuDi6wpVG3_aVKAvJub2RubuIkBOXN4yo2dCCn2S17BNc3lUdelK3y0p-JRe_ouEdJIFXWZNrgpdR9GEacYCd0K",
    images: [],
    ingredients: [
      { name: "Butternut squash, cubed", quantity: "1 medium" },
      { name: "Coconut milk", quantity: "1/2 cup" },
      { name: "Vegetable broth", quantity: "3 cups" },
      { name: "Yellow onion, chopped", quantity: "1 unit" },
      { name: "Nutmeg", quantity: "1/4 tsp" },
      { name: "Pumpkin seeds, toasted", quantity: "2 tbsp" }
    ],
    steps: [
      "Toss squash cubes, onions, and garlic in olive oil and roast at 400°F for 30 minutes.",
      "Transfer roasted veggies to a large pot, add vegetable broth, and bring to a simmer.",
      "Blend using an immersion blender until silky smooth.",
      "Stir in coconut milk, nutmeg, salt, and pepper. Serve garnished with pumpkin seeds."
    ],
    cookTime: 40,
    servings: 4,
    cuisine: "American",
    category: "Appetizer",
    dietType: "Vegetarian",
    price: 1,
    rating: 4.6,
    ratingCount: 1,
    aiGenerated: false
  },
  {
    title: "Classic Midnight Ramen",
    shortDescription: "Comforting Japanese miso ramen with rich broth, fresh tofu, green onions, and soft egg.",
    fullDescription: "A deep, umami-rich vegetarian ramen featuring a custom red miso broth, fresh ramen noodles, charred tofu cubes, baby bok choy, and a perfectly jammy soft-boiled egg.",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDPv68-pfVlCg1r-lcFv7UPJ1ZpaGcI8pxvKPCA2yZ_dMUtMCc0Dwu9Xh-aWoUofAvQ1TrsW0SmOiRWlpXB0KR8qvyi5IFt7pM4FEWFKDFhq6NCxdzm3MfQUKoNcJLJM8BfFbMKgC8jMjkeHNPnTNdlbi4d3wnU4PiQa9RkC5zG-_j21-6cT-bFzli2ZzTSxNTIxKp8Hgj_q1WfiBjvzthzVinoWWkIN_oX6dXvguq7pBOSHqdLjgIoM1_-3FJ1-beK9BAty0GvkFhM",
    images: [],
    ingredients: [
      { name: "Ramen noodles", quantity: "2 portions" },
      { name: "Red miso paste", quantity: "3 tbsp" },
      { name: "Firm tofu, pressed and cubed", quantity: "8 oz" },
      { name: "Vegetable broth", quantity: "4 cups" },
      { name: "Egg", quantity: "1 unit" },
      { name: "Green onions, sliced", quantity: "1/4 cup" },
      { name: "Nori sheets", quantity: "2 units" }
    ],
    steps: [
      "Boil egg for exactly 6.5 minutes, then submerge in ice water to keep yolk jammy.",
      "Pan-sear tofu cubes until golden on all sides.",
      "Heat broth and whisk in miso paste until dissolved. Keep warm.",
      "Cook ramen noodles in boiling water, then drain.",
      "Assemble bowls: lay down noodles, pour miso broth, arrange tofu, egg halves, green onions, and nori."
    ],
    cookTime: 30,
    servings: 2,
    cuisine: "Japanese",
    category: "Dinner",
    dietType: "Vegetarian",
    price: 2,
    rating: 4.9,
    ratingCount: 1,
    aiGenerated: false
  },
  {
    title: "Thai Green Tofu Curry",
    shortDescription: "A spicy, fragrant green curry cooked with coconut milk, tofu, and fresh vegetables.",
    fullDescription: "A staple of Thai street food, this dish combines green curry paste with rich coconut milk, fresh eggplant, bamboo shoots, and firm tofu cubes. Best served hot over jasmine rice.",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuC4n7iAZsKw86GDohR7A5wSmhaeC4FN3hfbVcRcp3OkHOH_Z6Km_hE930IOjoBHjux0ONpLsqx8f-_fKjaq459PkAa4HtAG6ctuknArW9abmi0xijtH9DMKPyaWP-uh1rl4iOoNgna51PzRFweTAhRpHmlzcswxB4LNXe8EZqjm_yqnjavPjemo8WgjXdoeeCx2cQsGX3jH1xRdEPbomipsWEQuZLJs2673eZO-NKG3MjVIFhR_--xbtODt0jPtpYiVLcIYVPquzl32",
    images: [],
    ingredients: [
      { name: "Thai green curry paste", quantity: "2 tbsp" },
      { name: "Coconut milk", quantity: "1 can" },
      { name: "Firm tofu, cubed", quantity: "10 oz" },
      { name: "Eggplant, sliced", quantity: "1 cup" },
      { name: "Red bell pepper", quantity: "1 unit" },
      { name: "Thai basil leaves", quantity: "1/4 cup" }
    ],
    steps: [
      "Heat a large wok and fry green curry paste in 2 tbsp of coconut cream until fragrant.",
      "Slowly pour in the remaining coconut milk and bring to a simmer.",
      "Add tofu cubes, eggplant, and bell pepper slices. Cook for 10-12 minutes.",
      "Stir in Thai basil leaves and remove from heat. Serve over hot rice."
    ],
    cookTime: 25,
    servings: 3,
    cuisine: "Thai",
    category: "Dinner",
    dietType: "Vegan",
    price: 2,
    rating: 4.8,
    ratingCount: 1,
    aiGenerated: false
  },
  {
    title: "Fluffy Blueberry Pancakes",
    shortDescription: "Voted best breakfast: sweet fluffy pancakes studded with juicy fresh blueberries.",
    fullDescription: "An all-time classic weekend breakfast. These pancakes are incredibly light and airy inside, crispy on the edges, and burst with sweet blueberry juices. Drenched in warm maple syrup.",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuAPGS-7TORvHJUNhrSmbjIvsPCGjfXR0CzKR7b7OBVoKsi3ai-25KJcM4CFzav-nxX1p4r2zz90QZKv64bieZ0kT5aAYdJLahd_di8H42OUk25yFoarMF05rg3g4P8341Poqk0l3yxyUllN1zxYxFoqtfAlkkDPPlg81S5faeEP4W2URDYTe2bQ9HUNtUzIyRjUDNYvIH6PIzhiwl9_qV_x4rvjmMfkXSrpQisdlLaFpfOkfIKTwkRtDEs9Dn5j3n2UrMO-ob7aEqY7",
    images: [],
    ingredients: [
      { name: "All-purpose flour", quantity: "1 1/2 cups" },
      { name: "Baking powder", quantity: "3 1/2 tsp" },
      { name: "Milk", quantity: "1 1/4 cups" },
      { name: "Butter, melted", quantity: "3 tbsp" },
      { name: "Fresh blueberries", quantity: "1 cup" },
      { name: "Maple syrup", quantity: "for serving" }
    ],
    steps: [
      "Whisk flour, baking powder, salt, and sugar in a large bowl.",
      "Pour in milk, egg, and melted butter. Whisk until mostly smooth (some lumps are fine).",
      "Heat a buttered griddle over medium heat. Pour batter onto griddle.",
      "Drop fresh blueberries onto the wet batter. Cook until bubbles form, flip, and cook until golden."
    ],
    cookTime: 15,
    servings: 3,
    cuisine: "American",
    category: "Breakfast",
    dietType: "None",
    price: 1,
    rating: 4.9,
    ratingCount: 1,
    aiGenerated: false
  },
  {
    title: "Midnight Chocolate Lava Cake",
    shortDescription: "Rich, decadent chocolate cakes with a warm, gooey liquid center.",
    fullDescription: "A dessert lover's dream: individual chocolate cakes baked just enough so the outer cake sets while the center remains a warm, flowing chocolate lava. Perfect for romantic dinners.",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDicfpM_1iBjJefe3Rk_zf_IOndNE1Xg2ckH65C4S_HWtQtV4_uBHdlvsWrLlh3ho3Rh4Iq8A67YnPfvg_HpsPk3_DgRdFESXjL3gX4N1zAElz6fddrAbaoQ-Ybr0TUVps93o7qK-irYD5cNTpmrQr5L-JjWnBFsJTHkUdApyWfzU2C0Q2kLEyDdz_2Gx7eN_5pwHPK9cG1JARplKN_DH0dPXnQuodD23R8Al9Gq84CxNdyoj5dQ3o2uoIRbmQsGGMMt6TlPy3kDfZi",
    images: [],
    ingredients: [
      { name: "High-quality dark chocolate", quantity: "4 oz" },
      { name: "Butter", quantity: "1/2 cup" },
      { name: "Whole eggs", quantity: "2 units" },
      { name: "Egg yolks", quantity: "2 units" },
      { name: "Sugar", quantity: "1/4 cup" },
      { name: "All-purpose flour", quantity: "2 tbsp" }
    ],
    steps: [
      "Preheat oven to 425°F. Grease and flour 4 ramekins.",
      "Melt dark chocolate and butter together in a double boiler.",
      "In a separate bowl, beat eggs, egg yolks, sugar, and salt until thick and pale.",
      "Fold melted chocolate and flour into the egg mixture.",
      "Divide batter among ramekins. Bake for 12-14 minutes until edges are firm but center jiggles slightly. Invert onto plates immediately."
    ],
    cookTime: 20,
    servings: 4,
    cuisine: "French",
    category: "Dessert",
    dietType: "Vegetarian",
    price: 3,
    rating: 4.8,
    ratingCount: 1,
    aiGenerated: false
  },
  {
    title: "Zesty Lemon Garlic Shrimp",
    shortDescription: "Juicy shrimp sautéed in a garlic butter sauce, splashed with fresh lemon.",
    fullDescription: "A classic Mediterranean appetizer featuring plump, juicy shrimp cooked in a buttery garlic emulsion and flavored with red pepper flakes and fresh lemon juice. Ready in under 10 minutes.",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuAHS5xLcK5hU-m_aMoxolGzPipG1Wzce5_3XdtfqNNsbuRSW8YnvnIyYyff5hevgbXnNGlz94LQ8Q6fUqTpLPlO27QqBlRpB3bsqx97jyzxyjbjemSxjGxTKuQdOJC6GT6ciEQoJ60UyN6BW-0mXEkXlwrchEPyM8Xy9lK2N7ZbKAXE-lFmfbpAN2Wpd1JUF541B6YZDung7q4env2i7hHvUcY6XGbIm5DbXWMGu3VKGUFoe6q0R_djhewplCXtWtSwGUDU5tIZhXOt",
    images: [],
    ingredients: [
      { name: "Raw shrimp, peeled and deveined", quantity: "1 lb" },
      { name: "Unsalted butter", quantity: "4 tbsp" },
      { name: "Garlic, minced", quantity: "5 cloves" },
      { name: "Lemon, juiced and zested", quantity: "1 unit" },
      { name: "Red pepper flakes", quantity: "1/2 tsp" },
      { name: "Fresh parsley, chopped", quantity: "2 tbsp" }
    ],
    steps: [
      "Melt butter in a large skillet over medium-high heat.",
      "Add garlic and red pepper flakes, cook for 1 minute until fragrant.",
      "Add shrimp and cook for 2 minutes per side until pink and opaque.",
      "Remove from heat, stir in lemon juice, zest, and fresh parsley. Serve hot with crusty bread."
    ],
    cookTime: 10,
    servings: 3,
    cuisine: "Spanish",
    category: "Appetizer",
    dietType: "None",
    price: 2,
    rating: 4.7,
    ratingCount: 1,
    aiGenerated: false
  }
];

const seedDB = async () => {
  try {
    console.log("⚡ Starting database seeding...");
    await mongoose.connect(env.MONGO_URI);
    console.log("📡 Connected to MongoDB...");

    // Clear existing data
    await User.deleteMany({});
    await Recipe.deleteMany({});
    console.log("🗑️ Cleared existing Users and Recipes.");

    // Create Demo User
    const demoUser = await User.create({
      name: "Demo Chef",
      email: "demo@flavorai.com",
      password: "Demo@123", // Hashes automatically via pre-save middleware hook
      avatar: "https://lh3.googleusercontent.com/aida/AP1WRLv0MNIn3VQrnA3_0t0h18NnpfNhav6EpIah_RDXBf_YlTQlaXdFbjkQb1Wo9AwzsdKfOYlBkgolAgikCfPn3sOqvdhCQOn6Kik6P5HPiM6c74eccGu4qu7rWIIklrX085xy_OrKeI-4WV9fBNhEi-_nN27lHtCRmK23pXcjo-7BkxjzzcPFsuci6js8zdzajFrUnU7UpDhtVqbZJ0Lw7ZkQOsxo0N6LBFbgrmthndDzIrb8f99I5lEfghxg",
      preferences: {
        dietType: "None",
        allergies: [],
        favoriteCuisines: ["Italian", "French", "Japanese"],
      },
    });
    console.log(`👤 Created Demo User: ${demoUser.email}`);

    // Map recipes to include creator ID and default reviews
    const recipesToSeed = recipesData.map((recipe) => {
      const seededReviews = [
        {
          user: demoUser._id,
          comment: "Absolutely delicious! This is now a staple in my household.",
          rating: 5,
          date: new Date(),
        },
      ];

      return {
        ...recipe,
        createdBy: demoUser._id,
        reviews: seededReviews,
        ratingCount: 1,
        rating: recipe.rating || 5.0,
      };
    });

    const seededRecipes = await Recipe.insertMany(recipesToSeed);
    console.log(`🍳 Seeded ${seededRecipes.length} recipes successfully!`);

    // Log seed views in User's interaction history to kick off recommendation engine
    demoUser.interactionHistory.push(
      { recipeId: seededRecipes[0]._id, action: "view", timestamp: new Date() },
      { recipeId: seededRecipes[1]._id, action: "view", timestamp: new Date() }
    );
    await demoUser.save();
    console.log("📈 Initial interaction history set up for Demo user.");

    console.log("🎉 Database seeding completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error during database seeding:", error);
    process.exit(1);
  }
};

seedDB();
