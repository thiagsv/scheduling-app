import { db } from "../db/database";
 
export const list = () => {
    return db.prepare("SELECT * FROM employees").all();
};