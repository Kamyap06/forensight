-- MySQL dump 10.13  Distrib 8.0.46, for Win64 (x86_64)
--
-- Host: localhost    Database: forensight
-- ------------------------------------------------------
-- Server version	8.0.46

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Current Database: `forensight`
--

CREATE DATABASE /*!32312 IF NOT EXISTS*/ `forensight` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;

USE `forensight`;

--
-- Table structure for table `analysisfindings`
--

DROP TABLE IF EXISTS `analysisfindings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `analysisfindings` (
  `finding_id` int NOT NULL AUTO_INCREMENT,
  `evidence_id` int NOT NULL,
  `finding_type` varchar(100) NOT NULL,
  `severity` enum('Low','Medium','High','Critical') NOT NULL DEFAULT 'Low',
  `description` text NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`finding_id`),
  KEY `evidence_id` (`evidence_id`),
  CONSTRAINT `analysisfindings_ibfk_1` FOREIGN KEY (`evidence_id`) REFERENCES `evidence` (`evidence_id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `analysisfindings`
--

LOCK TABLES `analysisfindings` WRITE;
/*!40000 ALTER TABLE `analysisfindings` DISABLE KEYS */;
INSERT INTO `analysisfindings` VALUES (1,1,'Suspicious Link','High','Email contains a potentially malicious link','2026-10-15 11:59:05'),(2,2,'Unusual Activity','Critical','Logs show suspicious data access','2026-10-15 11:59:05'),(3,3,'Login Anomaly','Medium','Multiple unusual login attempts detected','2026-10-15 11:59:05'),(4,4,'Malware Indicator','High','File requires further malware analysis','2026-10-15 11:59:05'),(5,5,'Identity Mismatch','Low','Some identity details require verification','2026-10-15 11:59:05');
/*!40000 ALTER TABLE `analysisfindings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `auditlogs`
--

DROP TABLE IF EXISTS `auditlogs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `auditlogs` (
  `audit_id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` int DEFAULT NULL,
  `action` varchar(100) NOT NULL,
  `entity_type` varchar(100) NOT NULL,
  `entity_id` int DEFAULT NULL,
  `details` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`audit_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `auditlogs_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `auditlogs`
--

LOCK TABLES `auditlogs` WRITE;
/*!40000 ALTER TABLE `auditlogs` DISABLE KEYS */;
INSERT INTO `auditlogs` VALUES (1,1,'CREATE','Case',1,'Created phishing investigation case','2026-10-15 12:00:27'),(2,2,'UPLOAD','Evidence',2,'Uploaded access log evidence','2026-10-15 12:00:27'),(3,3,'UPDATE','Case',3,'Updated unauthorized login case','2026-10-15 12:00:27'),(4,4,'REVIEW','Evidence',4,'Reviewed suspicious executable','2026-10-15 12:00:27'),(5,5,'ARCHIVE','Evidence',5,'Archived identity report evidence','2026-10-15 12:00:27');
/*!40000 ALTER TABLE `auditlogs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `caseevidence`
--

DROP TABLE IF EXISTS `caseevidence`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `caseevidence` (
  `case_id` int NOT NULL,
  `evidence_id` int NOT NULL,
  PRIMARY KEY (`case_id`,`evidence_id`),
  KEY `evidence_id` (`evidence_id`),
  CONSTRAINT `caseevidence_ibfk_1` FOREIGN KEY (`case_id`) REFERENCES `cases` (`case_id`),
  CONSTRAINT `caseevidence_ibfk_2` FOREIGN KEY (`evidence_id`) REFERENCES `evidence` (`evidence_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `caseevidence`
--

LOCK TABLES `caseevidence` WRITE;
/*!40000 ALTER TABLE `caseevidence` DISABLE KEYS */;
/*!40000 ALTER TABLE `caseevidence` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cases`
--

DROP TABLE IF EXISTS `cases`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cases` (
  `case_id` int NOT NULL AUTO_INCREMENT,
  `title` varchar(200) NOT NULL,
  `incident_type` varchar(100) NOT NULL,
  `description` text,
  `priority` enum('Low','Medium','High','Critical') NOT NULL DEFAULT 'Medium',
  `status` enum('Open','In Progress','Closed') NOT NULL DEFAULT 'Open',
  `created_by` int NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`case_id`),
  KEY `created_by` (`created_by`),
  CONSTRAINT `cases_ibfk_1` FOREIGN KEY (`created_by`) REFERENCES `users` (`user_id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cases`
--

LOCK TABLES `cases` WRITE;
/*!40000 ALTER TABLE `cases` DISABLE KEYS */;
INSERT INTO `cases` VALUES (1,'Phishing Email Investigation','Phishing','Investigation of a suspicious email campaign','High','Open',1,'2026-10-15 11:57:31','2026-10-15 11:57:31'),(2,'Data Theft Case','Data Theft','Investigation of suspected confidential data theft','Critical','In Progress',2,'2026-10-15 11:57:31','2026-10-15 11:57:31'),(3,'Unauthorized Login','Unauthorized Access','Investigation of unusual account login activity','Medium','Open',3,'2026-10-15 11:57:31','2026-10-15 11:57:31'),(4,'Malware Analysis','Malware','Analysis of a suspected malicious file','High','In Progress',4,'2026-10-15 11:57:31','2026-10-15 11:57:31'),(5,'Identity Theft Report','Identity Theft','Investigation of suspected identity misuse','Low','Closed',5,'2026-10-15 11:57:31','2026-10-15 11:57:31');
/*!40000 ALTER TABLE `cases` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `custodylogs`
--

DROP TABLE IF EXISTS `custodylogs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `custodylogs` (
  `log_id` int NOT NULL AUTO_INCREMENT,
  `evidence_id` int NOT NULL,
  `user_id` int NOT NULL,
  `action` varchar(100) NOT NULL,
  `notes` text,
  `event_time` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`log_id`),
  KEY `evidence_id` (`evidence_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `custodylogs_ibfk_1` FOREIGN KEY (`evidence_id`) REFERENCES `evidence` (`evidence_id`),
  CONSTRAINT `custodylogs_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `custodylogs`
--

LOCK TABLES `custodylogs` WRITE;
/*!40000 ALTER TABLE `custodylogs` DISABLE KEYS */;
INSERT INTO `custodylogs` VALUES (1,1,1,'Evidence Registered','Original email file received','2026-10-15 11:58:26'),(2,2,2,'Evidence Reviewed','Access logs checked','2026-10-15 11:58:26'),(3,3,3,'Evidence Verified','Login report verified','2026-10-15 11:58:26'),(4,4,4,'Evidence Transferred','File sent for malware analysis','2026-10-15 11:58:26'),(5,5,5,'Evidence Archived','Investigation evidence archived','2026-10-15 11:58:26');
/*!40000 ALTER TABLE `custodylogs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `evidence`
--

DROP TABLE IF EXISTS `evidence`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `evidence` (
  `evidence_id` int NOT NULL AUTO_INCREMENT,
  `case_id` int NOT NULL,
  `evidence_name` varchar(255) NOT NULL,
  `evidence_type` varchar(50) NOT NULL,
  `file_path` varchar(500) NOT NULL,
  `sha256_hash` char(64) NOT NULL,
  `file_size` bigint unsigned NOT NULL,
  `collected_at` datetime DEFAULT NULL,
  `status` enum('Registered','Under Review','Verified','Archived') NOT NULL DEFAULT 'Registered',
  `uploaded_by` int NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`evidence_id`),
  KEY `case_id` (`case_id`),
  KEY `uploaded_by` (`uploaded_by`),
  CONSTRAINT `evidence_ibfk_1` FOREIGN KEY (`case_id`) REFERENCES `cases` (`case_id`),
  CONSTRAINT `evidence_ibfk_2` FOREIGN KEY (`uploaded_by`) REFERENCES `users` (`user_id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `evidence`
--

LOCK TABLES `evidence` WRITE;
/*!40000 ALTER TABLE `evidence` DISABLE KEYS */;
INSERT INTO `evidence` VALUES (1,1,'suspicious_email.eml','Email','/evidence/email1.eml','aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',2048,'2026-10-01 10:30:00','Registered',1,'2026-10-15 11:58:00'),(2,2,'access_log.txt','Log File','/evidence/access_log.txt','bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',4096,'2026-10-02 11:00:00','Under Review',2,'2026-10-15 11:58:00'),(3,3,'login_report.csv','CSV File','/evidence/login_report.csv','cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc',1024,'2026-10-03 09:15:00','Verified',3,'2026-10-15 11:58:00'),(4,4,'suspicious_file.exe','Executable','/evidence/suspicious_file.exe','dddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd',8192,'2026-10-04 14:20:00','Under Review',4,'2026-10-15 11:58:00'),(5,5,'identity_report.pdf','PDF','/evidence/identity_report.pdf','eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',3072,'2026-10-05 12:45:00','Archived',5,'2026-10-15 11:58:00');
/*!40000 ALTER TABLE `evidence` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `evidencenotes`
--

DROP TABLE IF EXISTS `evidencenotes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `evidencenotes` (
  `note_id` int NOT NULL AUTO_INCREMENT,
  `evidence_id` int NOT NULL,
  `user_id` int NOT NULL,
  `note_text` text NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`note_id`),
  KEY `evidence_id` (`evidence_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `evidencenotes_ibfk_1` FOREIGN KEY (`evidence_id`) REFERENCES `evidence` (`evidence_id`),
  CONSTRAINT `evidencenotes_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `evidencenotes`
--

LOCK TABLES `evidencenotes` WRITE;
/*!40000 ALTER TABLE `evidencenotes` DISABLE KEYS */;
INSERT INTO `evidencenotes` VALUES (1,1,2,'Email headers need detailed inspection','2026-10-15 12:00:02'),(2,2,3,'Review timestamps for unusual access','2026-10-15 12:00:02'),(3,3,4,'Login attempts require further checking','2026-10-15 12:00:02'),(4,4,5,'File should be analyzed in a secure environment','2026-10-15 12:00:02'),(5,5,1,'Evidence has been stored for future reference','2026-10-15 12:00:02');
/*!40000 ALTER TABLE `evidencenotes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `investigationtasks`
--

DROP TABLE IF EXISTS `investigationtasks`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `investigationtasks` (
  `task_id` int NOT NULL AUTO_INCREMENT,
  `case_id` int NOT NULL,
  `assigned_to` int NOT NULL,
  `task_title` varchar(200) NOT NULL,
  `description` text,
  `due_date` date DEFAULT NULL,
  `status` enum('Pending','In Progress','Completed') NOT NULL DEFAULT 'Pending',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`task_id`),
  KEY `case_id` (`case_id`),
  KEY `assigned_to` (`assigned_to`),
  CONSTRAINT `investigationtasks_ibfk_1` FOREIGN KEY (`case_id`) REFERENCES `cases` (`case_id`),
  CONSTRAINT `investigationtasks_ibfk_2` FOREIGN KEY (`assigned_to`) REFERENCES `users` (`user_id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `investigationtasks`
--

LOCK TABLES `investigationtasks` WRITE;
/*!40000 ALTER TABLE `investigationtasks` DISABLE KEYS */;
INSERT INTO `investigationtasks` VALUES (1,1,2,'Review Email','Inspect email headers and links','2026-10-20','Pending','2026-10-15 11:59:24'),(2,2,3,'Analyze Access Logs','Review logs for suspicious access','2026-10-21','In Progress','2026-10-15 11:59:24'),(3,3,4,'Check Login History','Identify unusual login patterns','2026-10-22','Pending','2026-10-15 11:59:24'),(4,4,5,'Analyze File','Examine the suspicious executable','2026-10-23','In Progress','2026-10-15 11:59:24'),(5,5,1,'Finalize Report','Prepare the final investigation report','2026-10-24','Completed','2026-10-15 11:59:24');
/*!40000 ALTER TABLE `investigationtasks` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `taskassignments`
--

DROP TABLE IF EXISTS `taskassignments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `taskassignments` (
  `task_id` int NOT NULL,
  `user_id` int NOT NULL,
  `assigned_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `assignment_status` enum('Assigned','In Progress','Completed') NOT NULL DEFAULT 'Assigned',
  PRIMARY KEY (`task_id`,`user_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `taskassignments_ibfk_1` FOREIGN KEY (`task_id`) REFERENCES `investigationtasks` (`task_id`),
  CONSTRAINT `taskassignments_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `taskassignments`
--

LOCK TABLES `taskassignments` WRITE;
/*!40000 ALTER TABLE `taskassignments` DISABLE KEYS */;
/*!40000 ALTER TABLE `taskassignments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `user_id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `email` varchar(150) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `role` enum('Admin','Investigator','Viewer') NOT NULL DEFAULT 'Investigator',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`user_id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'Kamya Pawar','kamya@example.com','hash_demo_001','Admin','2026-10-15 11:55:03'),(2,'Malishka Sachdev','malishka@example.com','hash_demo_002','Investigator','2026-10-15 11:55:03'),(3,'Laxmi Rathod','laxmi@example.com','hash_demo_003','Investigator','2026-10-15 11:55:03'),(4,'Harsh Rane','harsh@example.com','hash_demo_004','Viewer','2026-10-15 11:55:03'),(5,'Amey Joshi','amey@example.com','hash_demo_005','Investigator','2026-10-15 11:55:03');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-10-18 15:10:50
