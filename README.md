# Student Placement Portal

A deliberately small three-tier college practical project:

- **Frontend:** React + Vite, built and served by Nginx
- **Backend:** Node.js + Express REST API
- **Database:** PostgreSQL
- **Containers:** Docker Compose

The app lets you add students (name, email, branch, CGPA) and view saved records. PostgreSQL uses a named Docker volume, so records survive normal container restarts.

## 1. Requirements

- Docker Desktop on Windows, running with the Linux containers engine
- Git installed (for cloning/pushing the repository)
- Internet for the first Docker image build

You do not need to install Node.js or PostgreSQL on your PC.

## 2. Run locally on Windows PowerShell

```powershell
cd $HOME\Desktop
 git clone YOUR_GITHUB_REPOSITORY_URL placement-portal
cd .\placement-portal
docker compose up -d --build
docker compose ps
```

Open **http://localhost:8080**. Add a test student and confirm that the record appears in the table.

Check the API:

```powershell
Invoke-RestMethod http://localhost:8080/api/students
```

Check the database:

```powershell
docker compose exec db psql -U postgres -d placement -c "SELECT * FROM students;"
```

Prove persistence (this does not delete the database volume):

```powershell
docker compose down
docker compose up -d
```

Refresh the page. The student record should still be there.

## 3. Push this project to GitHub (one-time setup)

Create an empty GitHub repository named `student-placement-portal`. Do not add a README or .gitignore on GitHub because these are already included here.

From the project folder in PowerShell:

```powershell
git init
git add .
git commit -m "Add student placement portal with Docker Compose"
git branch -M main
git remote add origin https://github.com/YOUR_GITHUB_USERNAME/student-placement-portal.git
git push -u origin main
```

Replace `YOUR_GITHUB_USERNAME` with your GitHub username. The repository URL can be copied from your GitHub repository page.

## 4. AWS EC2 deployment during the practical

### A. Launch the EC2 instance in the AWS Console

1. Open **EC2 → Instances → Launch instances**.
2. Name: `placement-portal`.
3. AMI: **Ubuntu Server 24.04 LTS**, 64-bit x86.
4. Instance type: choose a 2 GiB RAM option such as `t3.small` if available and within your budget. Check the current price before launching; eligibility and pricing vary by account and region.
5. Create a new RSA key pair and download the `.pem` file. Keep it safe and do not upload it to GitHub.
6. In the security group, allow:
   - SSH, TCP 22, source **My IP**.
   - Custom TCP, port **8080**, source **My IP** (or the examiner's required source).
7. Storage: 15–20 GiB is a practical choice for this small project.
8. Launch the instance and copy its **Public IPv4 address**.

Do not add inbound rules for ports 5000 or 5432. The API and database are private to the Docker network; only the frontend port 8080 needs browser access.

### B. Connect from Windows PowerShell

Put your downloaded key file somewhere convenient, for example `Downloads`. Then:

```powershell
cd $HOME\Downloads
ssh -i .\placement-key.pem ubuntu@YOUR_EC2_PUBLIC_IP
```

Replace the key filename and public IP with your actual values. Type `yes` if SSH asks whether to trust the host for the first connection.

If Windows reports that the private key permissions are too open, run this in PowerShell on your PC (not inside SSH):

```powershell
icacls .\placement-key.pem /inheritance:r
icacls .\placement-key.pem /grant:r "$($env:USERNAME):(R)"
```

Then retry SSH.

### C. Install Docker on EC2

Run these commands inside the Ubuntu SSH session:

```bash
sudo apt update
sudo apt install -y git
curl -fsSL https://get.docker.com | sudo sh
sudo docker --version
sudo docker compose version
```

### D. Clone and start the project

Still inside the Ubuntu SSH session:

```bash
git clone https://github.com/YOUR_GITHUB_USERNAME/student-placement-portal.git
cd student-placement-portal
sudo docker compose up -d --build
sudo docker compose ps
```

Replace the GitHub username with the real one. The first build downloads images and dependencies, so it can take several minutes.

### E. Verify in your browser

On your PC, open:

```text
http://YOUR_EC2_PUBLIC_IP:8080
```

Add a student. Confirm it appears in the table. You have now deployed the three-tier app on EC2.

To verify from the EC2 terminal:

```bash
sudo docker compose exec db psql -U postgres -d placement -c "SELECT * FROM students;"
```

### F. Stop the application after the practical

To stop the containers but keep the database volume:

```bash
sudo docker compose down
```

To start it again later:

```bash
sudo docker compose up -d
```

When finished with the AWS practical, stop or terminate the EC2 instance according to your instructor's instructions. Check AWS billing; EBS storage and other resources may still incur charges after an instance is stopped. Terminating an instance can delete its attached storage depending on the settings you choose.

## 5. Useful commands

Run these from the project directory (prefix with `sudo` on EC2):

```bash
docker compose ps
docker compose logs

docker compose logs backend
docker compose logs db
docker compose restart
```

## 6. Common problems

- **Docker Desktop not running locally:** Start Docker Desktop and wait until its engine is ready.
- **Browser cannot open EC2 site:** Confirm the instance is running, use `http://` and port `8080`, and check the EC2 security group allows inbound TCP 8080 from your current public IP.
- **SSH timeout:** Check inbound SSH port 22 allows your current public IP. If your network IP changed, update the My IP rule.
- **Permission denied for SSH key:** Apply the `icacls` commands above and verify you selected the correct `.pem` file.
- **Containers are not healthy:** Run `sudo docker compose logs` and check that all three services are running.
- **Port 8080 already in use on your PC:** Change the frontend mapping from `8080:80` to `8081:80`, rebuild/restart, and use `http://localhost:8081` locally. For EC2, keep 8080 unless you also update the security group.
- **Data disappeared:** Do not use `docker compose down -v`. The `-v` option deletes the named PostgreSQL volume and its data.

## 7. Important notes

- This is a learning/demo project, not a production system.
- The database password in `docker-compose.yml` is a simple demo password. Do not reuse it for real applications or expose PostgreSQL publicly.
- Do not commit `.pem` private keys, personal credentials, or production secrets to GitHub.
- The EC2 public IPv4 address can change after stopping and starting an instance unless you use an Elastic IP (not needed for this practical).
