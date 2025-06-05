const express = require('express');
const router = express.Router();
const upload = require('./multer');
const pool = require('./pool'); 

// Get all employees
router.get('/all', function (req, res) {
  pool.query('SELECT * FROM users', function (err, result) {
    if (err) {
      console.log(err);
      res.status(500).json({
        message: "Database Error! Please contact backend team.",
        status: false,
      });
    } else {
      res.status(200).json(result);
    }
  });
});


//one company per id
router.get("/check_company", (req, res) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    pool.query("SELECT COUNT(*) AS companyCount FROM company WHERE userId = ?", [userId], (error, results) => {
      if (error) {
        console.error("Error checking company:", error);
        return res.status(500).json({ error: "Internal server error" });
      }

      console.log("Query Result:", results); // Debugging output

      const companyCount = results[0].companyCount;

      if (companyCount === 1) {
        return res.json({ exists: true, message: "User has a single company entry" });
      } else if (companyCount > 1) {
        return res.json({ exists: true, message: `User has multiple (${companyCount}) company entries. Check for duplicates.` });
      } else {
        return res.json({ exists: false, message: "User has no company entry" });
      }
    });
  } catch (error) {
    console.error("Error checking company:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});


// Insert employee
router.post('/insert', function (req, res) {
  const { email, ename, emob, epass } = req.body;

  // Validate the input (optional, depending on your use case)
  if (!email || !ename || !emob || !epass) {
    return res.status(400).json({
      message: "Please provide all the required fields: email, name, mobile, and password.",
      status: false,
    });
  }

  // SQL query to insert data into the employee table
  pool.query(
    'INSERT INTO users (email, name, mobile, password) VALUES (?, ?, ?, ?)',
    [email, ename, emob, epass],
    function (err, result) {
      if (err) {
        console.log(err);
        res.status(500).json({
          message: "Database Error. Please contact the backend team!",
          status: false,
        });
      } else {
        res.status(200).json({
          message: "Employee Submitted Successfully",
          status: true,
        });
      }
    }
  );
});

// Login employee
router.post('/login', function (req, res) {
  pool.query(
    'SELECT * FROM users WHERE (email = ? OR mobile = ?) AND password = ?',
    [req.body.email, req.body.emob, req.body.password],
    function (error, result) {
      if (error) {
        return res.status(500).json({
          message: 'Database error, please contact the backend team... ' + error,
          status: false
        });
      } else {
        if (result.length === 1) {
          const user = result[0]; // Store user details

          return res.status(200).json({
            message: 'Success',
            status: true,
            user: user // Send full user data
          });
        } else {
          return res.status(200).json({
            message: 'Invalid Email ID/Mobile Number/Password',
            status: false
          });
        }
      }
    }
  );
});


// Insert company
router.post('/insert_company', upload.single('companyImage'), function (req, res) {
  pool.query(
    'INSERT INTO company (company_name, establishment_date, ceo_name, type, google_link, co2, company_image, state, city, emission , userid) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?,?)',
    [req.body.companyName, req.body.establishmentDate, req.body.ceoName, req.body.industryType, req.body.googleMapLink, req.body.co2Emission, req.file.filename, req.body.state, req.body.city, req.body.emission,req.body.userId],
    function (err, result) {
      if (err) {
        console.log(err);
        res.status(404).json({
          message: "Database Error. Please contact backend team.",
          status: false,
        });
      } else {
        res.status(200).json({ message: "Company Submitted Successfully", status: true });
      }
    }
  );
});

// Show all companies
router.get('/show_company', function (req, res) {
  pool.query(`SELECT * FROM company where vstatus = 'verified'`, function (err, result) {
    if (err) {
      console.log(err);
      res.status(404).json({
        message: "Database Error! Please contact the backend team.",
        status: false,
      });
    } else {
     
      res.status(200).json({
        message: "Company data retrieved successfully",
        status: true,
        data: result
      });
    }
  });
});

// Get company details by companyId
router.get('/companycard/:companyId', function (req, res) {
  const { companyId } = req.params;

  // Optional: Check if companyId is valid (this could be a simple check)
  if (!companyId || isNaN(companyId)) {
    return res.status(400).json({
      message: "Invalid companyId parameter",
      status: false
    });
  }

  pool.query('SELECT * FROM company WHERE company_id = ?', [companyId], function (err, result) {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({
        message: "Database error. Please contact backend team.",
        status: false,
      });
    }

    if (result.length === 0) {
      return res.status(404).json({
        message: "Company not found",
        status: false,
      });
    }

    return res.status(200).json({
      message: "Company details fetched successfully",
      status: true,
      data: result[0] // Assuming the result is an array, and you want a single company
    });
  });
});

// Insert company verification
router.post('/insert_verification/:companyId', function (req, res) {
  const companyId = req.params.companyId;
  console.log(companyId);

  // Make sure the companyId is an integer (for validation)
  const parsedCompanyId = parseInt(companyId, 10);
  if (isNaN(parsedCompanyId)) {
    return res.status(400).json({
      message: "Invalid companyId. It must be an integer.",
      status: false,
    });
  }

  const status = req.body.status;
  console.log(typeof(status));

  // Ensure the status is either 'Verified' or 'Rejected'
  

  pool.query(
    'UPDATE company SET vstatus = ? WHERE company_id = ?',
    [ status,parsedCompanyId],
    function (err, verificationResult) {
      if (err) {
        return res.status(404).json({
          message: "Verification Table Error. Please contact backend team.",
          status: false,
        });
      } else {
        return res.status(200).json({
          message: "Verification Submitted Successfully",
          status: true,
        });
      }
    }
  );
});
 //for company data
 router.get("/company", (req, res) => {
  const userId = req.query.userId;



  // Query to fetch company details for the given userId
  pool.query("SELECT * FROM company WHERE userid = ?", [userId], (err, result) => {
    if (err) {
      console.error("Error fetching company:", err);
      return res.status(500).json({ error: "Internal server error", status: "false" });
    } else if (result.length === 0) {
      return res.status(404).json({ error: "Company not found", status: "false" });
    } else if (result.length === 1) {
      console.log(result[0]);
      return res.status(200).json({ data: result[0], status: "true" });
    } else {
      console.log(result[0])
      return res.status(200).json({ data: result[0], status: "true" });
    }
  });
});








module.exports = router;