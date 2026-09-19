import os
import subprocess
import sys


def run(command: list[str]) -> None:
    print(f"Running: {' '.join(command)}")
    subprocess.run(command, check=True)


def main() -> None:
    database_url = os.getenv("DATABASE_URL") or os.getenv("POSTGRES_URL") or os.getenv("POSTGRES_PRISMA_URL")

    if not database_url:
        print("No hosted Postgres URL found. Skipping migrations and seed during Vercel build.")
        return

    run([sys.executable, "-m", "alembic", "upgrade", "head"])
    run([sys.executable, "-m", "app.db.seed"])


if __name__ == "__main__":
    main()
