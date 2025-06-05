const express = require('express');
const router = express.Router();
const pool = require('./pool'); // Ensure this points to your MySQL connection
const upload = require('./multer');

/** ==========================
 *  Admin Login API (Simple)
 *  Endpoint: POST /admin/login
 *  Body: { "username": "admin", "password": "admin123" }
 *  ========================== */
router.post('/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
      return res.status(400).json({ success: false, message: "Username and password are required!" });
  }

  pool.query("SELECT * FROM admins WHERE name = ? OR email = ?", [username, username], (error, results) => {
      if (error) {
          console.error("Error executing query: ", error);
          return res.status(500).json({ success: false, message: "Database error", error });
      }

      if (results.length === 0) {
          return res.status(401).json({ success: false, message: "Invalid username or password" });
      }

      const user = results[0];

      if (user.password !== password) {
          return res.status(401).json({ success: false, message: "Invalid username or password" });
      }

      // Build the image URL
      const imageUrl = user.image 
          ? `http://localhost:5000/images/${user.image}` 
          : null;

      // Remove sensitive data before sending the response
      const { password: _, ...userData } = user;

      // Add image URL to the response
      res.json({ 
          success: true, 
          message: "Login successful", 
          user: { ...userData, imageUrl }
      });
  });
});


router.post("/insert_monthly_data", async (req, res) => {
    try {
      const { company_id, month_name, year, data_value } = req.body;
  
      // Check if all fields are provided
      if (!company_id || !month_name || !year || !data_value) {
        return res.status(400).json({ status: false, message: "All fields are required!" });
      }
  
      // Insert query
      const query = `
        INSERT INTO monthly_data (company_id, month_name, year, data_value) 
        VALUES (?, ?, ?, ?)
      `;
  
      // Execute query
      await pool.query(query, [company_id, month_name, year, data_value]);
  
      res.json({ status: true, message: "Data inserted successfully!" });
    } catch (error) {
      console.error("Insert Error:", error);
      res.status(500).json({ status: false, message: "Database error!" });
    }
  })

  router.post("/upload", upload.single("banner"), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ status: false, message: "No file uploaded" });
        }

        // Store only the filename instead of the full path
        const bannerFilename = req.file.filename;

        const query = "INSERT INTO banners (banner) VALUES (?)";
        await pool.query(query, [bannerFilename]);

        res.json({ status: true, message: "Banner uploaded successfully!", fileName: bannerFilename });
    } catch (error) {
        res.status(500).json({ status: false, message: "Error uploading banner", error });
    }
});


router.get("/all", async (req, res) => {
    try {
        const query = "SELECT * FROM banners";
        const [rows] = await pool.query(query);

        res.json({ status: true, banners: rows });
    } catch (error) {
        res.status(500).json({ status: false, message: "Error fetching banners", error });
    }
});

router.get("/monthly_data/:company_id", (req, res) => {
    const companyId = req.params.company_id;
    const sql = "SELECT * FROM monthly_data WHERE company_id = ? ORDER BY year DESC, month_name ASC";
    
    pool.query(sql, [companyId], (err, results) => {
      if (err) {
        console.error("Error fetching data:", err);
        res.status(500).json({ status : false, message: "Database query failed" });
      } else {
        res.status(200).json({status:true,data: results,message : "data gone"});
      }
    });
  });
  

 
  router.get("/all_data", (req, res) => {
    const sql = `
       SELECT 
    md.*, 
    c.company_name, 
    c.establishment_date, 
    c.ceo_name, 
    c.type, 
    c.google_link, 
    c.co2, 
    c.company_image, 
    c.state, 
    c.city, 
    c.emission, 
    c.userid, 
    c.vstatus
FROM 
    monthly_data md
JOIN 
    company c 
ON 
    md.company_id = c.company_id
WHERE 
    c.vstatus = 'verified';

    `;

    pool.query(sql, (err, results) => {
        if (err) {
            console.error("Error fetching data:", err);
            return res.status(500).json({ status: false, message: "Database query failed" });
        }
        res.status(200).json({ status: true, data: results, message: "Data fetched successfully" });
    });
});


router.get('/show_pending_company', async (req, res) => {
    
        const query = `
            select * from company where vstatus = 'pending'
        `;

        pool.query(query, (err, result) => {
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
           
          })})


          router.get('/show_rejected_company', async (req, res) => {
    
            const query = `
                select * from company where vstatus = 'rejected'
            `;
    
            pool.query(query, (err, result) => {
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
               
              })})

//alter image
router.get("/show_image/:id", (req, res) => {
  const adminId = req.params.id;

  pool.query(
    "SELECT picture FROM admins WHERE adminid = ?",
    [adminId],
    (err, result) => {
      if (err) {
        console.error("Error fetching image:", err);
        return res.status(500).json({ status: false, message: "Failed to fetch image" });
      }

      if (result.length === 0) {
        return res.status(404).json({ status: false, message: "Admin not found" });
      }

      // Return only the image name
      const imageName = result[0].picture;

      res.status(200).json({
        status: true,
        message: "Image fetched successfully",
        image: imageName  // Send only the image name
      });
    }
  );
});

              

module.exports = router;
