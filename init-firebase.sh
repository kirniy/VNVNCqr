#!/bin/bash

# Firebase initialization script for VNVNC Birthday Event
echo "🚀 Initializing Firebase for VNVNC Birthday Event..."

# Initialize Firebase services
echo "📦 Initializing Firebase services..."
firebase init firestore hosting storage --project vnvnc-invites

# Deploy Firebase rules and indexes
echo "🔐 Deploying security rules..."
firebase deploy --only firestore:rules,firestore:indexes,storage:rules --project vnvnc-invites

# Build the project
echo "🏗️ Building the project..."
npm run build

# Deploy to Firebase
echo "🚀 Deploying to Firebase Hosting..."
firebase deploy --only hosting --project vnvnc-invites

echo "✅ Firebase deployment complete!"
echo "🔗 Admin Panel: https://vnvnc-invites.web.app/admin"
echo "📧 Login: admin@vnvnc.ru"
echo "🔑 Password: VNVNC2025"