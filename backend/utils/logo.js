// Barangay Ibabao Official Logo
const fs = require('fs');
const path = require('path');

// Function to get base64 encoded logo from file
function getLogoBase64() {
  try {
    const logoPath = path.join(__dirname, '..', 'assets', 'barangay-logo.png.jpg');
    if (fs.existsSync(logoPath)) {
      const logoBuffer = fs.readFileSync(logoPath);
      return `data:image/png;base64,${logoBuffer.toString('base64')}`;
    } else {
      console.log('Logo file not found at:', logoPath);
      return null;
    }
  } catch (error) {
    console.error('Error reading logo file:', error);
    return null;
  }
}

// Official Barangay Ibabao Logo HTML snippet
function getBarangayLogoHTML() {
  const logoBase64 = getLogoBase64();
  
  if (logoBase64) {
    return `
      <div style="
        width: 70px;
        height: 70px;
        border-radius: 50%;
        overflow: hidden;
        display: flex;
        align-items: center;
        justify-content: center;
        border: 2px solid #333;
      ">
        <img src="${logoBase64}" alt="Barangay Ibabao Logo" style="
          width: 100%;
          height: 100%;
          object-fit: cover;
        " />
      </div>
    `;
  } else {
    // Fallback if logo file is not found
    return `
      <div style="
        width: 70px;
        height: 70px;
        border-radius: 50%;
        border: 2px solid #333;
        display: flex;
        align-items: center;
        justify-content: center;
        background-color: #f5f5f5;
      ">
        <div style="
          color: #333;
          font-weight: bold;
          font-size: 10px;
          text-align: center;
          line-height: 1.2;
        ">
          BARANGAY<br/>IBABAO
        </div>
      </div>
    `;
  }
};

module.exports = {
  getLogoBase64,
  getBarangayLogoHTML
};
