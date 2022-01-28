"use strict";

const req = require("express/lib/request");
const db = require("../db");
const { BadRequestError, NotFoundError, ExpressError } = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sql");

/** Related functions for jobs. */

class Job {
  /** Create a job (from data), update db, return new job data.
   *
   * data should be { title, salary, equity, company_handle }
   *
   * Returns { id, title, salary, equity, company_handle }
   *
   * Throws BadRequestError if job already in database.
   * */

  static async create({ title, salary, equity, companyHandle }) {
    const duplicateCheck = await db.query(
          `SELECT id, title, company_handle
           FROM jobs
           WHERE title = $1 AND company_handle = $2`,
           [title, companyHandle]);

    if (duplicateCheck.rows[0]){
      throw new BadRequestError(`Duplicate job: ${title} ${companyHandle}`);}

    const result = await db.query(
          `INSERT INTO jobs
           (title, salary, equity, company_handle)
           VALUES ($1, $2, $3, $4)
           RETURNING id, title, salary, equity, company_handle AS company`,
        [ title, +salary, +equity, companyHandle ]
    );
    const job = result.rows[0];

    return job;
  }

  /** Find all jobs, filtering by query parameters if included.
   *
   * Returns [{ id, title, salary, equity, company_handle }, ...]
   * */

  static async findAll(queries={}) {
    let whereString = "";

    // if query parameters, create a WHERE string for the db query
    if (Object.keys(queries).length > 0) {

      if (queries.title) {
        whereString += `WHERE title ILIKE '%${queries.title}%'`;
      }

      if (queries.minSalary) {
        whereString += (queries.title) ? ' AND ':'WHERE ';
        whereString += `salary >=${+queries.minSalary}`
      }

      if (queries.hasEquity) {
        whereString += (queries.title || queries.minSalary) ? ' AND ':'WHERE ';
        whereString += `equity > 0`
      }
    }

    const jobsRes = await db.query(
          `SELECT id,
                  title,
                  salary,
                  equity,
                  company_handle AS company
           FROM jobs
           ${whereString}
           ORDER BY id`);

    return jobsRes.rows;
  }

  /** Given a company handle, return data about company.
   *
   * Returns { handle, name, description, numEmployees, logoUrl, jobs }
   *   where jobs is [{ id, title, salary, equity, companyHandle }, ...]
   *
   * Throws NotFoundError if not found.
   **/

  static async get(id) {
    const jobRes = await db.query(
          `SELECT id,
                  title,
                  salary,
                  equity,
                  company_handle AS company
           FROM jobs
           WHERE id = $1`,
           [id]);

    const job = jobRes.rows[0];

    if (!job) throw new NotFoundError(`No job with id: ${id} `);

    return job;
  }

  /** Update job data with `data`.
   *
   * This is a "partial update" --- it's fine if data doesn't contain all the
   * fields; this only changes provided ones.
   *
   * Data can include: {title, salary, equity }
   *
   * Returns {id, title, salary, equity, company_handle }
   *
   * Throws NotFoundError if not found.
   */

  static async update(jobId, data) {
    const { setCols, values } = sqlForPartialUpdate(
        data,
        { companyHandle: "company_handle " });
    const jobIdVarIdx = "$" + (values.length + 1);

    const querySql = `UPDATE jobs 
                      SET ${setCols} 
                      WHERE id = ${jobIdVarIdx} 
                      RETURNING id, 
                                title, 
                                salary, 
                                equity, 
                                company_handle AS company`;
    const result = await db.query(querySql, [...values, jobId]);
    const job = result.rows[0];

    if (!job) throw new NotFoundError(`No job with id: ${jobId}`);

    return job;
  }

  /** Delete given job from database; returns undefined.
   *
   * Throws NotFoundError if job not found.
   **/

  static async remove(id) {
    const result = await db.query(
          `DELETE
           FROM jobs
           WHERE id = $1
           RETURNING id`,
        [id]);
    const job = result.rows[0];

    if (!job) throw new NotFoundError(`No job with id: ${id}`);
  }
}


module.exports = Job;
