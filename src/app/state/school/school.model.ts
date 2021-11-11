import { School } from "../../entities/school";

export type SchoolInfo = Pick<School, "id" | "name" | "startingMonth" | 'modules' | "managementSystem">;
