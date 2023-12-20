//import the necessary Node.js modules
const express = require("express"); //creating the server
const app = express(); 
const bodyParser = require("body-parser"); //  for parsing incoming request bodies
const mysql = require("mysql2"); //interacting with MySQL databases
const cors = require("cors"); //handling Cross-Origin Resource Sharing
//Database Connection:
const db = mysql.createPool({
    host: "localhost",
    user: "root",
    password: "Kaashvi@2013",
    database: "test_Kth",
    port: "3306",
})  
//Express Application Setup:
app.use(cors()); //enables Cross-Origin Resource Sharing to handle requests from different origins.
app.use(express.json()); //parsing JSON-encoded bodies of requests.
app.use(bodyParser.urlencoded({extended: true})); //parsing URL-encoded bodies of requests.
//API Endpoint for Fetching Grouped Data:
app.get("/api/get", (req, res) => {
  const sqlquery = "select distinct c.Kod, c.Benämning, c.Kur, dt.period, dt.points, s.students, e.fname, e.lname,  a.time, e.ssnb from course c join duration_table dt on dt.Kod = c.Kod join program p on c.Kod = p.Kod join class s on s.class = p.class join assignments a on a.Kod = c.Kod join employee e on a.ssnb = e.ssnb order by c.Kod, dt.period";
  db.query(sqlquery,(error, result) => {
       
    const groupedData = {}; //objrct

    result.forEach(item => {
      const key = `${item.Kod}-${item.Benämning}`;
      if (!groupedData[key]) { // group and organize the fetched data based on the "course:code"
        //If the group does not exist, create a new group with initial data
        groupedData[key] = {
          code: item.Kod,
          
          periods: [
            {
              period: item.period,
              points: [item.points],
              
            },
          ],
          professor: [
            {
              fname: item.fname,
              lname: item.lname,
              time: item.time,
              ssnb: item.ssnb,   
              fullname: `${item.fname.slice(0, 2)}${item.lname.slice(0, 2)}`,
            },
          ],
          name: item.Benämning,
          factor: item.Kur,
          students: item.students,
          
        };
      } else {
         // If the group already exists, update existing data
        const existingPeriod = groupedData[key].periods.find(period => period.period === item.period);
        if (existingPeriod) {
          if (!existingPeriod.points.includes(item.points)) {
          existingPeriod.points.push(item.points);
          }
          
        } else {
          groupedData[key].periods.push({
            period: item.period,
            points: [item.points],
          });
        };
        const existingProf = groupedData[key].professor.find(prof => prof.ssnb === item.ssnb);
        if (existingProf) {
          existingProf.time+=item.time;
          
        } else {
          groupedData[key].professor.push({
            fname: item.fname,
              lname: item.lname,
              time: item.time,
              ssnb: item.ssnb, 
              fullname: `${item.fname.slice(0, 2)}${item.lname.slice(0, 2)}`,
          });
        };
        
      };
    
    });
    //Calculating Average Time:
    Object.values(groupedData).forEach((group) => {
      group.professor.forEach((prof) => {
        const uniquePeriods = new Set(group.periods.map((period) => period.period));
        prof.time /= uniquePeriods.size;
      
      });
    });
    //Preparing Output Data:
    const outputData = Object.values(groupedData);
    console.log(JSON.stringify(outputData, null, 2));
    res.send(outputData);
  });
});

app.get("/", (req, res) => {

});
//Server Start:
app.listen(5000, () => {
    console.log("Server is running on port 5000");
});