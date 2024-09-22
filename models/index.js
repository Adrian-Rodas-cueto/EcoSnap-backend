// index.js
const fs = require("fs");
const path = require("path");
const sequelize = require("../config/database");

// Import all models from the current directory
const models = {};
fs.readdirSync(__dirname)
  .filter((file) => file !== "index.js") // Exclude this file
  .forEach((file) => {
    const model = require(path.join(__dirname, file));
    // console.log('file:::',model.init(sequelize))

    models[model.name] = model.init(sequelize); // Initialize model with Sequelize and assign it to models object
  });

// Define associations between models
Object.values(models).forEach((model) => {
  if (model) {
    // console.log(model)
    model.associate(models);
  }
});

// Function to sync all models except the specified ones
const syncAllModelsExcept = async (modelNames = []) => {
  try {
    for (const model of Object.values(models)) {
      if (!modelNames.includes(model.name)) {
        await model.sync({ alter: true });
      }
    }
    console.log(
      "All models (except the specified ones) were synchronized successfully."
    );
  } catch (error) {
    console.error("Error synchronizing models:", error);
  }
};

// Function to sync specific models with force: true
const syncSpecificModelsWithForce = async (modelNames = []) => {
  try {
    for (const modelName of modelNames) {
      const model = models[modelName];
      if (model) {
        await model.sync({ alter: true });
        console.log(
          `${modelName} model was synchronized successfully with force: true.`
        );
      } else {
        console.error(`Model ${modelName} not found.`);
      }
    }
  } catch (error) {
    if (error.original && error.original.code === "ER_FK_CANNOT_DROP_PARENT") {
      console.error(
        `Cannot drop table due to a foreign key constraint. Consider handling this constraint or not using force: true.`
      );
    } else {
      console.error("Error syncing models with force: true", error);
    }
  }
};

// Synchronize models with the database
(async () => {
  try {
    await sequelize.sync({
      alter: true,
    }); // Synchronize all models

    // const modelsToForceSync = ["FrameworkContract"]; // Add the models you want to force sync

    // await syncAllModelsExcept(modelsToForceSync); // Sync all models except the specified ones
    // await syncSpecificModelsWithForce(modelsToForceSync); // Sync the specified models with force: true
    console.log("All models were synchronized successfully.");
  } catch (error) {
    console.error("Error synchronizing models:", error);
  }
})();

module.exports = models;
