import { DataTypes, Model } from "sequelize";
import type { Optional } from "sequelize";
import sequelize from "../infra/db/sequelize.js";

export interface MintsAttributes {
    id: string;
    order_id: number;
    tx_hash: string;
    status: string;
    error?: string;
    block_number?: number;
    confirmations?: number;
    submitted_at?: Date;
    confirmed_at?: Date;
    createdAt?: Date;
    updatedAt?: Date;
}

export type MintsCreationAttributes = Optional<
    MintsAttributes,
    "id" | "createdAt" | "updatedAt"
>;

export class Mints
    extends Model<MintsAttributes, MintsCreationAttributes>
    implements MintsAttributes
{
    declare id: string;
    declare order_id: number;
    declare tx_hash: string;
    declare status: string;
    declare error?: string;
    declare block_number?: number;
    declare confirmations?: number
    declare submitted_at?: Date;
    declare confirmed_at?: Date;
    declare readonly createdAt: Date;
    declare readonly updatedAt: Date;
}

Mints.init(
    {
        id: {
            type: DataTypes.UUID,
            primaryKey: true,
            defaultValue: DataTypes.UUIDV4,
        },
        order_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            unique: true,
        },
        tx_hash: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        status: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        error: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        block_number: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        confirmations: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        submitted_at: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        confirmed_at: {
            type: DataTypes.DATE,
            allowNull: true,
        },
    },
    {
        sequelize,
        tableName: "mints",
        underscored: true,
        timestamps: true,
    }
);
export default Mints;
