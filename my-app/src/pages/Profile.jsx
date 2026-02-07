import React, { useContext, useEffect, useState } from 'react'
import { AuthContext } from '../auth/AuthContext'
import { reportService } from '../../backend/services/reportService'
import '../App.css'

function Profile() {
  const { user } = useContext(AuthContext)
  const [myReports, setMyReports] = useState([])
  const [points, setPoints] = useState(0)

  useEffect(() => {
    async function fetchReports() {
      const reports = await reportService.getMyReports()
      setMyReports(reports)
      // 5 points per fire hydrant report
      const hydrantPoints = reports.filter(r => r.type === 'hydrant').length * 5
      setPoints(hydrantPoints)
    }
    fetchReports()
  }, [])

  return (
    <div className="content-page">
      <div className="content-container">
        <h1>Profile</h1>
        <p><strong>Email:</strong> {user?.email}</p>
        <p><strong>Points:</strong> {points}</p>
        <h2>My Reports</h2>
        <ul>
          {myReports.map(report => (
            <li key={report.id}>
              <strong>{report.type.charAt(0).toUpperCase() + report.type.slice(1)}</strong> - {report.status} - {new Date(report.created_at).toLocaleDateString()}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

export default Profile
