import { DataTypes, Model } from "sequelize";
import type { Optional } from "sequelize";
import sequelize from "../infra/db/sequelize.js";

export interface OrdersAttributes {
    id: number;
    wallet: string;
    token_id: number;
    quantity: number;
    expected_amount: number;
    status: string;
    nowpayments_payment_id?: string;
    invoice_url?: string;
    createdAt?: Date;
    updatedAt?: Date;
}

export type OrdersCreationAttributes = Optional<
    OrdersAttributes,
    "id" | "createdAt" | "updatedAt"
>;

export class Orders
    extends Model<OrdersAttributes, OrdersCreationAttributes>
    implements OrdersAttributes
{
    declare id: number;
    declare wallet: string;
    declare token_id: number;
    declare quantity: number;
    declare expected_amount: number;
    declare status: string;
    declare nowpayments_payment_id?: string;
    declare invoice_url?: string;
    declare readonly createdAt: Date;
    declare readonly updatedAt: Date;
}

Orders.init(
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        wallet: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
        token_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        quantity: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        expected_amount: {
            type: DataTypes.DECIMAL,
            allowNull: false,
        },
        status: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        nowpayments_payment_id: {
            type: DataTypes.STRING,
            allowNull: true,
            unique: true,
        },
        invoice_url: {
            type: DataTypes.STRING,
            allowNull: true,
        }
    },
    {
        sequelize,
        tableName: "orders",
        underscored: true,
        timestamps: true,
    }
);
export default Orders;
