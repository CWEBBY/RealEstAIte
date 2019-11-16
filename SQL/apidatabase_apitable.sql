CREATE DATABASE  IF NOT EXISTS `apidatabase` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;
USE `apidatabase`;
-- MySQL dump 10.13  Distrib 8.0.18, for Win64 (x86_64)
--
-- Host: 127.0.0.1    Database: apidatabase
-- ------------------------------------------------------
-- Server version	8.0.18

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `apitable`
--

DROP TABLE IF EXISTS `apitable`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `apitable` (
  `primaryid` int(11) NOT NULL,
  `objective` longtext,
  `propertyTypes_` longtext,
  `listingstatus` longtext,
  `saleMode` longtext,
  `channel` longtext,
  `addressParts_stateAbbreviation` longtext,
  `addressParts_displayType` longtext,
  `addressParts_streetNumber` longtext,
  `addressParts_unitNumber` longtext,
  `addressParts_street` longtext,
  `addressParts_suburb` longtext,
  `addressParts_suburbId` longtext,
  `addressParts_postcode` longtext,
  `addressParts_displayAddress` longtext,
  `advertiserIdentifiers_advertiserType` longtext,
  `advertiserIdentifiers_advertiserId` longtext,
  `advertiserIdentifiers_contactIds_001` longtext,
  `advertiserIdentifiers_contactIds_002` longtext,
  `advertiserIdentifiers_contactIds_003` longtext,
  `bathrooms` longtext,
  `bedrooms` longtext,
  `buildingAreaSqm` longtext,
  `carspaces` longtext,
  `dateAvailable` longtext,
  `dateUpdated` longtext,
  `propertydescription` longtext,
  `features_001` longtext,
  `features_002` longtext,
  `features_003` longtext,
  `features_004` longtext,
  `features_005` longtext,
  `features_007` longtext,
  `features_008` longtext,
  `features_009` longtext,
  `features_010` longtext,
  `features_011` longtext,
  `features_012` longtext,
  `features_013` longtext,
  `features_014` longtext,
  `features_015` longtext,
  `features_016` longtext,
  `features_017` longtext,
  `features_018` longtext,
  `features_019` longtext,
  `geoLocation_latitude` longtext,
  `geoLocation_longitude` longtext,
  `headline` longtext,
  `id` longtext,
  `inspectionDetails_` longtext,
  `inspectionDetails_recurrence` longtext,
  `inspectionDetails_closingDateTime` longtext,
  `inspectionDetails_openingDateTime` longtext,
  `inspectionDetails_pastInspections_recurrence` longtext,
  `inspectionDetails_pastInspections_closingDateTime` longtext,
  `inspectionDetails_pastInspections_openingDateTime` longtext,
  `inspectionDetails_isByAppointmentOnly` longtext,
  `isNewDevelopment` longtext,
  `landAreaSqm` longtext,
  `media_category` longtext,
  `media_type` longtext,
  `media_url` longtext,
  `priceDetails_canDisplayPrice` longtext,
  `priceDetails_displayPrice` longtext,
  `saleDetails_saleMethod` longtext,
  `saleDetails_auctionDetails_auctionSchedule_locationDescription` longtext,
  `saleDetails_auctionDetails_auctionSchedule_openingDateTime` longtext,
  `saleDetails_tenderDetails_tenderRecipientName` longtext,
  `saleDetails_tenderDetails_tenderAddress` longtext,
  `saleDetails_tenantDetails_leaseDateVariable` longtext,
  `saleDetails_tenantDetails_leaseOptions` longtext,
  `saleDetails_tenantDetails_tenantName` longtext,
  `saleDetails_tenantDetails_tenantRentDetails` longtext,
  `saleDetails_saleTerms` longtext,
  `seoUrl` longtext,
  `virtualTourUrl` longtext
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `apitable`
--

LOCK TABLES `apitable` WRITE;
/*!40000 ALTER TABLE `apitable` DISABLE KEYS */;
/*!40000 ALTER TABLE `apitable` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2019-11-16 22:08:01
