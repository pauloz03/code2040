import React, { useEffect, useState } from 'react'
import { reportService } from '../../backend/services/reportService'
import '../App.css'

function Leaderboard() {
  const [leaders, setLeaders] = useState([])

  useEffect(() => {
    async function fetchLeaderboard() {
      const allReports = await reportService.getAllReports()

      const pointsByUser = {}

      allReports.forEach(r => {
        if (r.type === 'hydrant' && r.user_id) {
          pointsByUser[r.user_id] = (pointsByUser[r.user_id] || 0) + 5
        }
      })

      const leaderboard = Object.entries(pointsByUser)
        .map(([userId, points]) => ({
          userId,
          name: 'Paulo', // 👈 demo name
          points
        }))
        .sort((a, b) => b.points - a.points)
        .slice(0, 10)

      setLeaders(leaderboard)
    }

    fetchLeaderboard()
  }, [])

  return (
    <div className="content-page">
      <div className="content-container">
        <h1>Leaderboard</h1>
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '2rem' }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', padding: '0.5rem', borderBottom: '1px solid #ddd' }}>Rank</th>
              <th style={{ textAlign: 'left', padding: '0.5rem', borderBottom: '1px solid #ddd' }}>User</th>
              <th style={{ textAlign: 'left', padding: '0.5rem', borderBottom: '1px solid #ddd' }}>Points</th>
            </tr>
          </thead>
          <tbody>
            {leaders.map((leader, idx) => (
              <tr key={leader.userId}>
                <td style={{ padding: '0.5rem' }}>{idx + 1}</td>
                <td style={{ padding: '0.5rem' }}>{leader.name}</td>
                <td style={{ padding: '0.5rem' }}>{leader.points}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default Leaderboard
