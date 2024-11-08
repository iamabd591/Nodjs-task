const dotenv = require("dotenv").config();
const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`Server is listening on PORT ${PORT}`);
});
