// Importing necessary module...
const express = require("express");
const sqlite3 = require("sqlite3");
const { open } = require("sqlite");
const path = require("path");

const port = 3000; // Defining the server port number...

app = express(); // server instance..
module.exports = app; // exporting the server instance by default method..
app.use(express.json()); //ensure that request body is in json format then it will parse that.

let dbPath = path.join(__dirname, "covid19India.db"); // Defining the path of the Database..
let db = null; // Database object...

// Initializing the database with node express js..
const initializeDbAndExpress = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(port, () => {
      console.log("Server Running at http:localhost:3000");
    });
  } catch (error) {
    console.log(`DB Error: ${error}`);
    process.exit(1);
  }
};

initializeDbAndExpress(); //Calling the function to initialize...

// snake_case to camelCase conversion...
const changeCase = (dbObject) => {
  return {
    stateId: dbObject.state_id,
    stateName: dbObject.state_name,
    population: dbObject.population,
  };
};

// snake_case to camelCase2 conversion...
const changeCase2 = (dbObject) => {
  return {
    districtId: dbObject.district_id,
    districtName: dbObject.district_name,
    stateId: dbObject.district_id,
    cases: dbObject.cases,
    cured: dbObject.cured,
    active: dbObject.active,
    deaths: dbObject.deaths,
  };
};

// snake_case to camelCase3 conversion..
const changeCase3 = (dbObject) => {
  return {
    stateName: dbObject.state_name,
  };
};
// 1. API - [GET] Returns a list of all states in the state table.. Path = /states/.
app.get("/states/", async (request, response) => {
  const getDetailsOfStateQuery = `
        SELECT 
            *
        FROM 
            state;
    `;

  const stateDetailsArray = await db.all(getDetailsOfStateQuery);
  camelCaseArray = [];
  for (let eachObject of stateDetailsArray) {
    camelCaseArray.push(changeCase(eachObject));
  }
  response.send(camelCaseArray);
});

// 2. API - [GET] Returns a state based on the state ID..  /states/:stateId/
app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const getUniqueStateQuery = `
        SELECT 
            *
        FROM 
            state
        WHERE 
            state_id = ${stateId};
    `;

  const singleStateArray = await db.get(getUniqueStateQuery);
  response.send(changeCase(singleStateArray));
});

// 3. API - [POST] Create a district in the district table, district_id is auto-incremented.. /districts/
app.post("/districts/", async (request, response) => {
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  const addDistrictQuery = `
    INSERT INTO
        district(district_name,state_id,cases,cured,active,deaths)
    VALUES
        ('${districtName}',${stateId}, ${cases}, ${cured}, ${active},${deaths});
  `;

  const dbResponse = await db.run(addDistrictQuery);
  response.send("District Successfully Added");
});

// 4. API - [GET] Returns a district based on the district ID.. /districts/:districtId/
app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const singleDistrictQuery = `
        SELECT 
            *
        FROM 
            district
        WHERE 
            district_id = ${districtId};
    `;

  const singleStateArray = await db.get(singleDistrictQuery);
  response.send(changeCase2(singleStateArray));
});

// 5.API - [DELETE] Deletes a district from the district table based on the district ID..   /districts/:districtId/
app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const deleteParticularDistrictQuery = `
        DELETE FROM district
        WHERE 
            district_id = ${districtId};
    `;

  const dbResponse = await db.run(deleteParticularDistrictQuery);
  response.send("District Removed");
});

// 6.API - [PUT] Updates the details of a specific district based on the district ID.. /districts/:districtId/
app.put("/districts/:districtId", async (request, response) => {
  const { districtId } = request.params;
  const { districtName, stateId, cases, cured, active, deaths } = request.body;

  const updateDistrictDetailsQuery = `
    UPDATE 
        district
    SET
        district_name = '${districtName}',
        state_id = ${stateId},
        cases = ${cases},
        cured = ${cured},
        active = ${active},
        deaths = ${deaths};
    WHERE 
        district_id = ${districtId}
  `;

  const dbResponse = await db.run(updateDistrictDetailsQuery);
  response.send("District Details Updated");
});

// 7.API = [GET] Returns the statistics of total cases, cured, active, deaths of a specific state based on state ID.. /states/:stateId/stats/
app.get("/states/:stateId/states/", async (request, response) => {
  const { stateId } = request.params;
  const singleStateQuery = `
        SELECT 
            SUM(cases) as totalCases,
            SUM(cured) as totalCured,
            SUM(active) as totalActive,
            SUM(deaths) as totalDeaths
        FROM 
            district
        WHERE 
            state_id = ${stateId};
    `;

  const singleStateArray = await db.all(singleStateQuery);
  response.send(singleStateArray);
});

// 8.API = [GET] Returns an object containing the state name of a district based on the district ID.. /districts/:districtId/details/
app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;
  const getSpecificDistrictDetailsQuery = `
        SELECT 
            state_name
        FROM 
            state NATURAL JOIN district;
        WHERE
            district_id = ${districtId};
    `;
  const specificDistrictDetails = await db.get(getSpecificDistrictDetailsQuery);
  response.send(changeCase3(specificDistrictDetails));
});
