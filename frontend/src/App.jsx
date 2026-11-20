import { useEffect, useState } from 'react';

const emptyForm = { name: '', email: '', branch: '', cgpa: '' };

export default function App() {
  const [students, setStudents] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);

  async function loadStudents() {
    try {
      const response = await fetch('/api/students');
      if (!response.ok) throw new Error('Unable to load students');
      setStudents(await response.json());
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadStudents(); }, []);

  function updateField(event) {
    setForm({ ...form, [event.target.name]: event.target.value });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage('');
    try {
      const response = await fetch('/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Could not save student');
      setForm(emptyForm);
      setMessage('Student added successfully.');
      await loadStudents();
    } catch (error) {
      setMessage(error.message);
    }
  }

  return (
    <main className="container">
      <header>
        <p className="eyebrow">COLLEGE PROJECT</p>
        <h1>Student Placement Portal</h1>
        <p className="subtitle">A simple portal to record and view student details.</p>
      </header>

      <section className="panel">
        <h2>Add a student</h2>
        <form onSubmit={handleSubmit}>
          <label>Full name<input name="name" value={form.name} onChange={updateField} placeholder="e.g. Rahul Sharma" required /></label>
          <label>Email<input name="email" type="email" value={form.email} onChange={updateField} placeholder="rahul@example.com" required /></label>
          <label>Branch<input name="branch" value={form.branch} onChange={updateField} placeholder="e.g. CSE" required /></label>
          <label>CGPA<input name="cgpa" type="number" min="0" max="10" step="0.01" value={form.cgpa} onChange={updateField} placeholder="e.g. 8.5" required /></label>
          <button type="submit">Add student</button>
        </form>
        {message && <p className="message" role="status">{message}</p>}
      </section>

      <section className="panel">
        <div className="table-heading"><h2>Students</h2><span>{students.length} records</span></div>
        {loading ? <p>Loading students...</p> : students.length === 0 ? <p className="empty">No students added yet.</p> : (
          <div className="table-wrap"><table>
            <thead><tr><th>ID</th><th>Name</th><th>Email</th><th>Branch</th><th>CGPA</th></tr></thead>
            <tbody>{students.map(student => <tr key={student.id}>
              <td>{student.id}</td><td>{student.name}</td><td>{student.email}</td><td>{student.branch}</td><td>{student.cgpa}</td>
            </tr>)}</tbody>
          </table></div>
        )}
      </section>
      <footer>React · Node.js · PostgreSQL · Docker Compose</footer>
    </main>
  );
}
