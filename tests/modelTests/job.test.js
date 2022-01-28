"use strict";

const db = require("../../db.js");
const { BadRequestError, NotFoundError, ExpressError } = require("../../expressError");
const Job = require("../../models/job.js");
const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** create */

describe("create", function () {
  const newJob = {
    title: "newTitle",
    salary: 115000,
    equity: .15,
    companyHandle: "c1"
  };

  test("works", async function () {
    let job = await Job.create(newJob);

    const result = await db.query(
          `SELECT id, title, salary, equity, company_handle AS company
           FROM jobs
           WHERE title = 'newTitle'`);
    expect(result.rows).toEqual([
      {
        id: expect.any(Number),
        title: newJob.title,
        salary: newJob.salary,
        equity: `${newJob.equity}`,
        company: newJob.companyHandle
      }
    ]);
  });

  test("bad request with dupe", async function () {
    try {
      await Job.create(newJob);
      await Job.create(newJob);
      fail();
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });
});

/************************************** findAll */

describe("findAll", function () {
  test("works: no filter", async function () {
    let jobs = await Job.findAll();
    expect(jobs).toEqual([
      {
        id: expect.any(Number),
        title: "J1",
        salary: 100000,
        equity: "0.10",
        company: "c1"
      },
      {
        id: expect.any(Number),
        title: "J2",
        salary: 125000,
        equity: "0.15",
        company: "c2"
      },
      {
        id: expect.any(Number),
        title: "J3",
        salary: 150000,
        equity: "0.00",
        company: "c3"
      }
    ]);
  });

  test("works: filter by title", async function () {
    let jobs = await Job.findAll({title: "J2"});
    expect(jobs).toEqual([
      {
        id: expect.any(Number),
        title: "J2",
        salary: 125000,
        equity: "0.15",
        company: "c2",
      }
    ])
  });

  test("works: filter by minimum salary", async function () {
    let jobs = await Job.findAll({minSalary: 150000});
    expect(jobs).toEqual([
      {
        id: expect.any(Number),
        title: "J3",
        salary: 150000,
        equity: "0.00",
        company: "c3",
      }
    ])
  });

  test("works: filter by hasEquity=true", async function () {
    let jobs = await Job.findAll({hasEquity: true});
    expect(jobs).toEqual([
      {
        id: expect.any(Number),
        title: "J1",
        salary: 100000,
        equity: "0.10",
        company: "c1"
        },
        {
        id: expect.any(Number),
        title: "J2",
        salary: 125000,
        equity: "0.15",
        company: "c2"
        }
    ])
  });

  test("works: filter by hasEquity=false", async function () {
    let jobs = await Job.findAll({hasEquity: false});
    expect(jobs).toEqual([
      {
        id: expect.any(Number),
        title: "J1",
        salary: 100000,
        equity: "0.10",
        company: "c1"
        },
        {
        id: expect.any(Number),
        title: "J2",
        salary: 125000,
        equity: "0.15",
        company: "c2"
        },
        {
        id: expect.any(Number),
        title: "J3",
        salary: 150000,
        equity: "0.00",
        company: "c3",
        }
    ])
  });

  test("works: multiple filters", async function () {
    let jobs = await Job.findAll({ minSalary:150000, hasEquity:true });
    expect(jobs).toEqual([])
  });

  test("works: filter with partial title", async function () {
    let jobs = await Job.findAll({title: "J"});
    expect(jobs).toEqual([
        {
        id: expect.any(Number),
        title: "J1",
        salary: 100000,
        equity: "0.10",
        company: "c1"
        },
        {
        id: expect.any(Number),
        title: "J2",
        salary: 125000,
        equity: "0.15",
        company: "c2"
        },
        {
        id: expect.any(Number),
        title: "J3",
        salary: 150000,
        equity: "0.00",
        company: "c3"
        }
    ])
  });
}); 

/************************************** get */

describe("get", function () {
  test("works", async function () {
    // get id for first job to use as test
    const allJobs = await Job.findAll();
    const testId = allJobs[0].id;

    let job = await Job.get(testId);
    expect(job).toEqual({
        id: testId,
        title: "J1",
        salary: 100000,
        equity: "0.10",
        company: "c1"
      }
    );
  });

  test("not found if no such job", async function () {
    try {
      await Job.get(999999);
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });

  test("not found if id missing", async function () {
    try {
      await Job.get();
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });

});


/************************************** update */

describe("update", function () {
  const updateData = {
    salary: 200000,
  };

  test("works when changing one data point", async function () {
    const allJobs = await Job.findAll();
    const jobToUpdate = allJobs[0]

    let jobWithUpdatedData = await Job.update(jobToUpdate.id, updateData);
    expect(jobWithUpdatedData).toEqual({
      id: jobToUpdate.id,
      title: jobToUpdate.title,
      salary: updateData.salary,
      equity: jobToUpdate.equity,
      company: jobToUpdate.company
    });

    const result = await db.query(
        `SELECT id, title, salary, equity, company_handle AS company
         FROM jobs
         WHERE id = ${jobWithUpdatedData.id}`);
    expect(result.rows).toEqual([{
        id: jobWithUpdatedData.id,
        title: jobWithUpdatedData.title,
        salary: updateData.salary,
        equity: jobWithUpdatedData.equity,
        company: jobWithUpdatedData.company,
    }]);
  });

  test("works: null fields", async function () {
    const allJobs = await Job.findAll();
    const jobToUpdate = allJobs[0]

    const updateDataSetNulls = {
      salary: null
    };

    let jobWithUpdatedData = await Job.update(jobToUpdate.id, updateDataSetNulls);
    expect(jobWithUpdatedData).toEqual({
        id: jobToUpdate.id,
        title: jobToUpdate.title,
        salary: null,
        equity: jobToUpdate.equity,
        company: jobToUpdate.company
    });

    const result = await db.query(
          `SELECT id, title, salary, equity, company_handle AS company
           FROM jobs
           WHERE id = ${jobWithUpdatedData.id}`);
    expect(result.rows).toEqual([{
      id: jobWithUpdatedData.id,
      title: jobWithUpdatedData.title,
      salary: null,
      equity: jobWithUpdatedData.equity,
      company: jobWithUpdatedData.company,
    }]);
  });

  test("not found if no such job", async function () {
    try {
      await Job.update(999999, updateData);
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });

  test("bad request error with no data", async function () {
    try {
      const allJobs = await Job.findAll();
      const jobToUpdate = allJobs[0]
      await Job.update(jobToUpdate.id, {});
      fail();
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });
});

/************************************** remove */

describe("remove", function () {
  test("works", async function () {
    const allJobs = await Job.findAll();
    const jobToRemove = allJobs[0];

    await Job.remove(jobToRemove.id);
    const res = await db.query(
        `SELECT id FROM jobs WHERE id=${jobToRemove.id}`);
    expect(res.rows.length).toEqual(0);
  });

  test("not found if no such job", async function () {
    try {
      await Job.remove(999999);
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});
