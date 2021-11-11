import { Student } from "../../entities/student";
import { Application } from "../../entities/application";

export interface ExportApplicationDTO {
    applications: Application[];
    data: string;
}
export interface ExportStudentDTO {
    students: Student[];
    data: string;
}
