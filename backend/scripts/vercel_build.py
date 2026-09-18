import os
import subprocess
import sys


def main() -> None:
    database_url = os.getenv("DATABASE_URL") or os.getenv("POSTGRES_URL") or os.getenv("POSTGRES_PRISMA_URL")

    if not database_url:
        print("No hosted Postgres URL found. Skipping migrations and seed during Vercel build.")
        return

    subprocess.run(["alembic", "upgrade", "head"], check=True)
    subprocess.run([sys.executable, "-m", "app.db.seed"], check=True)


if __name__ == "__main__":
    main()
