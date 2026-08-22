# Use the official Python slim image for a smaller footprint
FROM python:3.13-slim

# Set environment variables
# Prevents Python from writing pyc files to disc
ENV PYTHONDONTWRITEBYTECODE 1
# Prevents Python from buffering stdout and stderr
ENV PYTHONUNBUFFERED 1

# Set the working directory in the container
WORKDIR /app

# Install system dependencies
# We need libpq-dev for PostgreSQL and gcc for compiling some packages if needed
RUN apt-get update \
    && apt-get install -y --no-install-recommends gcc libpq-dev \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt /app/
RUN pip install --upgrade pip
RUN pip install -r requirements.txt

# Copy the Django project code into the container
COPY . /app/

# Expose the Django dev server port
EXPOSE 8000

# The command to run the development server
CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]
