var mysql = require('mysql');
var conn = mysql.createConnection({
  host: 'mysql-mariadb16-lon-101.zap-hosting.com', // Replace with your host name
  user: 'zap802408-2',      // Replace with your database username
  password: 'wioIUC2b9KychW2r',      // Replace with your database password
  database: 'zap802408-2' // // Replace with your database Name
}); 
conn.connect(function(err) {
  if (err) throw err;
  console.log('Database is connected successfully !');
});
module.exports = conn;