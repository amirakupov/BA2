import { Sequelize } from "sequelize";
import {DB_URL} from "../config/config.js";

const sequelize = new Sequelize(DB_URL, {
  dialect: "postgres",
  logging: false,
});

export default sequelize;
