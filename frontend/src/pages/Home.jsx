// import React from 'react';
// import Navbar from '../components/Navbar';

// export default function Home() {
//   return (
//     <>
//       <Navbar />
//       <marquee>Employee Attendance Portal</marquee>
//       <main className="container">
//         <section className="card">
//           <h2>Welcome</h2>
//           <p>Select an option from the top navigation to check-in/out, view history, request leave, or (if admin) open the dashboard.</p>
//         </section>
//       </main>
//     </>
//   );
// }






import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';

export default function Home() {
  const [blast, setBlast] = useState(false);

  // Auto-trigger the blast animation once on mount
  useEffect(() => {
    setTimeout(() => {
      setBlast(true);
      setTimeout(() => setBlast(false), 1000); // Reset after 2s
    }, 500); // Delay before first blast
  }, []);

  return (
    <>
      <Navbar />
      <marquee style={{ fontSize: "24px", fontWeight: "bold", color: "#1a6fee" }}>
        Employee Attendance Portal 
      </marquee>
      <main
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "80vh",
          // background: "linear-gradient(135deg, #e3f2fd, #bbdefb)",
          padding: "20px",
        }}
      >
        {/* Card */}
        <section
          style={{
            width: "400px",
            padding: "20px",
            borderRadius: "15px",
            boxShadow: "0 8px 20px rgba(0,0,0,0.2)",
            backgroundColor: "#fff",
            textAlign: "center",
            transform: blast ? "scale(0.5)" : "scale(1)",
            opacity: blast ? 0 : 1,
            transition: "all 1s ease",
          }}
        >
          <h2 style={{ marginBottom: "10px", color: "#1a6fee" }}>Welcome</h2>
          <p style={{ fontSize: "16px", color: "#444" }}>
            Select an option from the top navigation to check-in/out, view history,
            request leave, or (if admin) open the dashboard.
          </p>
        </section>

        {/* Inline keyframes */}
        <style>
          {`
            @keyframes fly {
              0% { transform: translateY(0); opacity: 1; }
              100% { transform: translateY(-600px); opacity: 0; }
            }
          `}
        </style>
      </main>
    </>
  );
}


