/* tslint:disable */
/**
 * This file was automatically generated by json-schema-to-typescript.
 * DO NOT MODIFY IT BY HAND. Instead, modify the source JSONSchema file,
 * and run json-schema-to-typescript to regenerate this file.
 */

export interface Log {
  id: string;
  date: string;
  level: "DEBUG" | "INFO" | "WARN" | "ERROR";
  account: string;
  content: string;
}
