import { DataTypes, Model } from "sequelize";
import type { Optional } from "sequelize";
import sequelize from "../infra/db/sequelize.js";

export interface EventLogAttributes {
    id: number;
    order_id: number;
    stage: string;
    order_status: string;
    mint_status: string;
    tx_hash: string;
    block_number: number;
    confirmations: number;
    message: string;
    error: string;
    emitted_at: Date;
    createdAt?: Date;
}

export type EventLogCreationAttributes = Optional<EventLogAttributes, "id" | "createdAt">;

export class EventLog
    extends Model<EventLogAttributes, EventLogCreationAttributes>
    implements EventLogAttributes
{
    declare id: number;
    declare order_id: number;
    declare stage: string;
    declare order_status: string;
    declare mint_status: string;
    declare tx_hash: string;
    declare block_number: number;
    declare confirmations: number;
    declare message: string;
    declare error: string;
    declare emitted_at: Date;
    declare readonly createdAt: Date;
}

EventLog.init(
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        order_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        stage: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        order_status: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: "",
        },
        mint_status: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: "",
        },
        tx_hash: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: "",
        },
        block_number: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
        },
        confirmations: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
        },
        message: {
            type: DataTypes.TEXT,
            allowNull: false,
            defaultValue: "",
        },
        error: {
            type: DataTypes.TEXT,
            allowNull: false,
            defaultValue: "",
        },
        emitted_at: {
            type: DataTypes.DATE(3),
            allowNull: false,
        },
    },
    {
        sequelize,
        tableName: "mint_event_logs",
        underscored: true,
        timestamps: true,
        updatedAt: false,
    }
);

export default EventLog;
