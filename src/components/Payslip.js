import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

const Payslip = () => {
  const [coach, setCoach] = useState(null);
  const [payslip, setPayslip] = useState(null);
  const [payslipHistory, setPayslipHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [error, setError] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const [selectedHistoryPayslip, setSelectedHistoryPayslip] = useState(null);
  const [showHistoryDetails, setShowHistoryDetails] = useState(false);

  // Handle Escape key to close modal
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && showHistoryDetails) {
        setShowHistoryDetails(false);
      }
    };
    
    if (showHistoryDetails) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [showHistoryDetails]);

  useEffect(() => {
    // Get coach info from localStorage
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user || user.userType !== 'coach') {
      setError('Access denied. Payslip is for coaches only.');
      setLoading(false);
      return;
    }
    setCoach(user);
    fetchPayslip(user._id);
  }, []);

  const fetchPayslip = async (coachId) => {
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:3001/api/payroll/payslip/${coachId}`);
      if (!res.ok) throw new Error('Failed to fetch payslip');
      const data = await res.json();
      setPayslip(data);
    } catch (err) {
      setError('Error fetching payslip.');
    } finally {
      setLoading(false);
    }
  };

  const fetchPayslipHistory = async (coachId) => {
    setHistoryLoading(true);
    try {
      const res = await fetch(`http://localhost:3001/api/payroll/history/${coachId}`);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to fetch payslip history');
      }
      const data = await res.json();
      setPayslipHistory(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching payslip history:', err);
      setPayslipHistory([]);
      // You could add a toast notification here if needed
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleViewHistory = () => {
    if (!showHistory && payslipHistory.length === 0) {
      fetchPayslipHistory(coach._id);
    }
    setShowHistory(!showHistory);
  };

  const fetchHistoricalPayslip = async (paymentDate) => {
    try {
      // Calculate the period based on payment date
      const date = new Date(paymentDate);
      const startDate = new Date(date.getFullYear(), date.getMonth(), 1);
      const endDate = new Date(date.getFullYear(), date.getMonth() + 1, 0);
      
      const res = await fetch(`http://localhost:3001/api/payroll/payslip/${coach._id}?start=${startDate.toISOString()}&end=${endDate.toISOString()}`);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to fetch historical payslip');
      }
      const data = await res.json();
      setSelectedHistoryPayslip(data);
      setShowHistoryDetails(true);
    } catch (err) {
      console.error('Error fetching historical payslip:', err);
      alert('Failed to load payslip details. Please try again.');
    }
  };

  if (loading) return <div style={{ padding: 40 }}>Loading payslip...</div>;
  if (error) return <div style={{ padding: 40, color: 'red' }}>{error}</div>;
  if (!payslip) return <div style={{ padding: 40 }}>No payslip data found.</div>;

  return (
    <>
      <section className="hero" style={{
        background: "linear-gradient(rgba(0,0,0,0.7), rgba(0,0,0,0.7)), url('/images/cage22.png') center/cover no-repeat"
      }}>
        <h1>PAYSLIP</h1>
        <p>View your salary breakdown and class earnings.</p>
      </section>
      <div style={{ minHeight: '100vh', background: '#fff', paddingTop: 40 }}>
        <div style={{ maxWidth: 700, margin: '0 auto', marginTop: 40 }}></div>
        <div style={{ maxWidth: 700, margin: '0 auto', marginTop: 16, background: '#fff', borderRadius: 16, boxShadow: '0 4px 24px rgba(0,0,0,0.10)', padding: 32, border: '1px solid #eee' }}>
          <Link to="/" className="return-home" style={{ display: 'block', marginBottom: 16, textAlign: 'left' }}>&larr; RETURN HOME</Link>
          <h2 style={{ color: '#145a32', fontWeight: 'bold', marginBottom: 16, textAlign: 'center' }}>Payslip</h2>
          <div style={{ marginBottom: 16, textAlign: 'center' }}>
            <strong>Coach:</strong> {coach.firstname} {coach.lastname}<br />
            <strong>Period:</strong> {new Date(payslip.periodStart).toLocaleDateString()} - {new Date(payslip.periodEnd).toLocaleDateString()}
          </div>
          <div style={{ marginBottom: 16, fontWeight: 'bold', color: '#145a32', textAlign: 'center' }}>
            Total Salary: ₱{(payslip.coachShare || 0).toLocaleString()}
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 24 }}>
            <thead>
              <tr style={{ background: '#f8f8f8' }}>
                <th style={{ padding: 8, border: '1px solid #eee' }}>Class</th>
                <th style={{ padding: 8, border: '1px solid #eee' }}>Date</th>
                <th style={{ padding: 8, border: '1px solid #eee' }}>Clients</th>
                <th style={{ padding: 8, border: '1px solid #eee' }}>Revenue</th>
                <th style={{ padding: 8, border: '1px solid #eee' }}>Coach Share (50%)</th>
              </tr>
            </thead>
            <tbody>
              {payslip.classBreakdown && payslip.classBreakdown.length > 0 ? (
                payslip.classBreakdown.map((c, i) => (
                  <tr key={i}>
                    <td style={{ padding: 8, border: '1px solid #eee' }}>{c.className}</td>
                    <td style={{ padding: 8, border: '1px solid #eee' }}>{new Date(c.date).toLocaleDateString()}</td>
                    <td style={{ padding: 8, border: '1px solid #eee' }}>{c.clientCount}</td>
                    <td style={{ padding: 8, border: '1px solid #eee' }}>₱{c.revenue.toLocaleString()}</td>
                    <td style={{ padding: 8, border: '1px solid #eee' }}>₱{c.coachShare.toLocaleString()}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" style={{ padding: 16, border: '1px solid #eee', textAlign: 'center', color: '#666' }}>
                    No class data available for this period.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          <div style={{ color: '#888', fontSize: 14, textAlign: 'center' }}>
            Note: This payslip only shows your salary. Gym earnings are not shown here.
          </div>
          
          {/* Payslip History Section */}
          <div style={{ marginTop: 32, borderTop: '1px solid #eee', paddingTop: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ color: '#145a32', fontWeight: 'bold', margin: 0 }}>Payslip History</h3>
              <button 
                onClick={handleViewHistory}
                style={{
                  background: '#145a32',
                  color: 'white',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 'bold'
                }}
              >
                {showHistory ? 'Hide History' : 'View History'}
              </button>
            </div>
            
            {showHistory && (
              <div>
                {historyLoading ? (
                  <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
                    Loading payslip history...
                  </div>
                ) : payslipHistory.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
                    No payslip history found.
                  </div>
                ) : (
                  <>
                    {/* Summary Stats */}
                    <div style={{ 
                      display: 'grid', 
                      gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', 
                      gap: '12px', 
                      marginBottom: '20px',
                      padding: '16px',
                      background: '#f8f9fa',
                      borderRadius: '8px'
                    }}>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#145a32' }}>
                          {payslipHistory.length}
                        </div>
                        <div style={{ fontSize: '12px', color: '#666' }}>Total Payments</div>
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#145a32' }}>
                          ₱{payslipHistory.reduce((sum, p) => sum + (p.amount || 0), 0).toLocaleString()}
                        </div>
                        <div style={{ fontSize: '12px', color: '#666' }}>Total Earned</div>
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#145a32' }}>
                          {payslipHistory.reduce((sum, p) => sum + (p.totalClasses || 0), 0)}
                        </div>
                        <div style={{ fontSize: '12px', color: '#666' }}>Total Classes</div>
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#145a32' }}>
                          {payslipHistory.reduce((sum, p) => sum + (p.totalClients || 0), 0)}
                        </div>
                        <div style={{ fontSize: '12px', color: '#666' }}>Total Clients</div>
                      </div>
                    </div>
                    
                    <div style={{ maxHeight: '400px', overflowY: 'auto', overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px' }}>
                        <thead>
                        <tr style={{ background: '#f8f8f8', position: 'sticky', top: 0 }}>
                          <th style={{ padding: 8, border: '1px solid #eee', textAlign: 'left' }}>Payment Date</th>
                          <th style={{ padding: 8, border: '1px solid #eee', textAlign: 'left' }}>Amount</th>
                          <th style={{ padding: 8, border: '1px solid #eee', textAlign: 'left' }}>Classes</th>
                          <th style={{ padding: 8, border: '1px solid #eee', textAlign: 'left' }}>Clients</th>
                          <th style={{ padding: 8, border: '1px solid #eee', textAlign: 'left' }}>Status</th>
                          <th style={{ padding: 8, border: '1px solid #eee', textAlign: 'left' }}>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {payslipHistory.map((payment, index) => (
                          <tr key={payment._id || index} style={{ borderBottom: '1px solid #f0f0f0' }}>
                            <td style={{ padding: 8, border: '1px solid #eee' }}>
                              {new Date(payment.paymentDate).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric'
                              })}
                            </td>
                            <td style={{ padding: 8, border: '1px solid #eee', fontWeight: 'bold', color: '#145a32' }}>
                              ₱{(payment.amount || 0).toLocaleString()}
                            </td>
                            <td style={{ padding: 8, border: '1px solid #eee' }}>
                              {payment.totalClasses || 0}
                            </td>
                            <td style={{ padding: 8, border: '1px solid #eee' }}>
                              {payment.totalClients || 0}
                            </td>
                            <td style={{ padding: 8, border: '1px solid #eee' }}>
                              <span style={{
                                padding: '4px 8px',
                                borderRadius: '4px',
                                fontSize: '12px',
                                fontWeight: 'bold',
                                background: payment.status === 'completed' ? '#d4edda' : '#fff3cd',
                                color: payment.status === 'completed' ? '#155724' : '#856404'
                              }}>
                                {payment.status === 'completed' ? 'Paid' : 'Pending'}
                              </span>
                            </td>
                            <td style={{ padding: 8, border: '1px solid #eee' }}>
                              <button
                                onClick={() => fetchHistoricalPayslip(payment.paymentDate)}
                                style={{
                                  background: '#007bff',
                                  color: 'white',
                                  border: 'none',
                                  padding: '4px 8px',
                                  borderRadius: '4px',
                                  cursor: 'pointer',
                                  fontSize: '12px'
                                }}
                              >
                                View Details
                              </button>
                            </td>
                          </tr>
                        ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Historical Payslip Details Modal */}
      {showHistoryDetails && selectedHistoryPayslip && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '24px',
            maxWidth: '800px',
            maxHeight: '80vh',
            overflowY: 'auto',
            margin: '20px',
            boxShadow: '0 4px 24px rgba(0,0,0,0.2)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ color: '#145a32', margin: 0 }}>Historical Payslip Details</h3>
              <button
                onClick={() => setShowHistoryDetails(false)}
                style={{
                  background: '#dc3545',
                  color: 'white',
                  border: 'none',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                Close
              </button>
            </div>
            
            <div style={{ marginBottom: 16, textAlign: 'center' }}>
              <strong>Coach:</strong> {coach.firstname} {coach.lastname}<br />
              <strong>Period:</strong> {new Date(selectedHistoryPayslip.periodStart).toLocaleDateString()} - {new Date(selectedHistoryPayslip.periodEnd).toLocaleDateString()}
            </div>
            
            <div style={{ marginBottom: 16, fontWeight: 'bold', color: '#145a32', textAlign: 'center' }}>
              Total Salary: ₱{(selectedHistoryPayslip.coachShare || 0).toLocaleString()}
            </div>
            
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 24 }}>
              <thead>
                <tr style={{ background: '#f8f8f8' }}>
                  <th style={{ padding: 8, border: '1px solid #eee' }}>Class</th>
                  <th style={{ padding: 8, border: '1px solid #eee' }}>Date</th>
                  <th style={{ padding: 8, border: '1px solid #eee' }}>Clients</th>
                  <th style={{ padding: 8, border: '1px solid #eee' }}>Revenue</th>
                  <th style={{ padding: 8, border: '1px solid #eee' }}>Coach Share (50%)</th>
                </tr>
              </thead>
              <tbody>
                {selectedHistoryPayslip.classBreakdown && selectedHistoryPayslip.classBreakdown.length > 0 ? (
                  selectedHistoryPayslip.classBreakdown.map((c, i) => (
                    <tr key={i}>
                      <td style={{ padding: 8, border: '1px solid #eee' }}>{c.className}</td>
                      <td style={{ padding: 8, border: '1px solid #eee' }}>{new Date(c.date).toLocaleDateString()}</td>
                      <td style={{ padding: 8, border: '1px solid #eee' }}>{c.clientCount}</td>
                      <td style={{ padding: 8, border: '1px solid #eee' }}>₱{c.revenue.toLocaleString()}</td>
                      <td style={{ padding: 8, border: '1px solid #eee' }}>₱{c.coachShare.toLocaleString()}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" style={{ padding: 16, border: '1px solid #eee', textAlign: 'center', color: '#666' }}>
                      No class data available for this period.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
};

export default Payslip; 