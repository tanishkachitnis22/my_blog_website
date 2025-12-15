# From Dockerfile to Docker Compose: A Beginner‑to‑Practitioner Guide

This post walks through a very common learning path with Docker—starting from **Dockerfiles**, building images, running containers, networking services together, and finally **why Docker Compose exists**. Along the way, we’ll clear up frequent confusions like `-p` vs `-d`, image names vs container names, and why `docker compose` sometimes fails on lab machines.

---

## 1. What a Dockerfile Really Is

A **Dockerfile** is a plain‑text recipe that tells Docker how to build an image. Each instruction creates a layer, and Docker executes them top‑to‑bottom.

Basic syntax:

```dockerfile
INSTRUCTION argument
```

### Core instructions

* **FROM** – sets the base image (mandatory)
* **RUN** – executes commands at build time
* **COPY** – copies files into the image
* **WORKDIR** – sets the working directory
* **EXPOSE** – documents which port the service listens on
* **CMD** – defines what runs when the container starts

Example:

```dockerfile
FROM ubuntu:22.04
WORKDIR /
RUN apt-get update && apt-get install -y apache2
EXPOSE 80
CMD ["apache2ctl", "-D", "FOREGROUND"]
```

This image contains **Apache** and starts it in the foreground when the container runs.

> Key idea: **Dockerfile = how you build an image**

---

## 2. Building an Image (and Naming It Correctly)

To build an image, run the command from the directory containing your `Dockerfile`:

```bash
docker build -t webserver .
```

Breakdown:

* `-t webserver` → the image name (your choice)
* `.` → the build context (current directory)

A successful build ends with:

```
Successfully built <IMAGE_ID>
Successfully tagged webserver:latest
```

If you **don’t** see this, the build failed.

---

## 3. Image Names vs Container Names (Common Trap)

These are different things:

* **Image name** → blueprint (e.g., `webserver`)
* **Container name** → running instance (e.g., `--name webserver`)

Example:

```bash
docker run --name webserver webserver
```

The first `webserver` is the **container name**.
The second `webserver` is the **image name**.

If Docker says it can’t find an image, check:

```bash
docker image ls
```

---

## 4. Networking Containers Together

Docker containers are isolated by default. To let them talk to each other, you attach them to the same Docker network.

```bash
docker network create ecommerce
```

Run containers on that network:

```bash
docker run -d -p 80:80 --name webserver --net ecommerce webserver

docker run -d --name database --net ecommerce \
  -e MYSQL_ROOT_PASSWORD=root \
  mysql:8.0
```

### What “networked together” means

* Containers share a **private virtual network**
* Docker provides **automatic DNS**
* Containers can reach each other by **name**

From inside `webserver`, MySQL is reachable at:

```
database:3306
```

> Important: **MySQL is NOT running on port 80**. Each container has its own ports.

---

## 5. `-p` vs `-d` (They Do Different Things)

These flags are often confused but are unrelated.

### `-p` — publish ports

```bash
-p 80:80
```

Maps:

```
HOST:80 → CONTAINER:80
```

This is only for **host‑to‑container** access (e.g., your browser).

### `-d` — detached mode

```bash
-d
```

Runs the container in the background and returns your terminal prompt.

### Typical real‑world usage

```bash
docker run -d -p 80:80 --name webserver webserver
```

---

## 6. Why You Don’t Run MySQL on the Apache Image

Each container should run **one main process**.

* Apache image → web server
* MySQL image → database

You **connect** containers; you don’t merge responsibilities.

This design:

* Improves security isolation
* Enables independent scaling
* Matches real‑world production patterns

---

## 7. Why Docker Compose Exists

Running everything manually doesn’t scale well:

* Too many commands
* Easy to misconfigure
* Hard to share setups

**Docker Compose** solves this by describing the system in YAML.

### Example `docker-compose.yml`

```yaml
version: "3.9"

services:
  web:
    image: webserver
    ports:
      - "80:80"

  db:
    image: mysql:8.0
    environment:
      MYSQL_ROOT_PASSWORD: root
```

Run everything with:

```bash
docker-compose up -d
```

Stop everything with:

```bash
docker-compose down
```

---

## 8. `docker compose` vs `docker-compose` (Why the Error Happens)

If you see:

```
docker: unknown command: docker compose
```

It means **Compose v2 is not installed**.

Use the older but widely supported command:

```bash
docker-compose up
```

Lab environments (CTFs, TryHackMe, cloud VMs) often use Compose v1.

---

## 9. Final Mental Model

* **Dockerfile** → how you build an image
* **Image** → immutable blueprint
* **Container** → running instance
* **Docker network** → private container LAN
* **Docker Compose** → system‑level orchestration

Once this clicks, Docker stops feeling like memorized commands and starts feeling like architecture.

---

## What’s Next?

From here, natural next steps are:

* Hardening Dockerfiles (non‑root users, minimal images)
* Secrets management
* Container security and lateral movement
* Mapping Docker concepts to Kubernetes

If you’ve made it this far, you’re no longer “just learning Docker”—you’re thinking like someone who will use it in real systems.
