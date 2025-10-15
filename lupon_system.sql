-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Sep 18, 2025 at 06:57 AM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `lupon_system`
--

-- --------------------------------------------------------

--
-- Table structure for table `arbitration`
--

CREATE TABLE `arbitration` (
  `id` int(11) NOT NULL,
  `complaint_id` int(11) NOT NULL,
  `date` date NOT NULL,
  `time` time NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `is_deleted` tinyint(1) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `arbitration`
--

INSERT INTO `arbitration` (`id`, `complaint_id`, `date`, `time`, `created_at`, `is_deleted`) VALUES
(51, 2025003, '2025-09-12', '08:00:00', '2025-09-10 08:26:30', 0),
(52, 2025001, '2025-09-17', '09:00:00', '2025-09-10 08:52:31', 0),
(53, 2025008, '2025-09-22', '13:00:00', '2025-09-10 09:04:11', 0),
(54, 2025009, '2025-09-23', '13:00:00', '2025-09-11 13:39:16', 0),
(55, 2025007, '2025-09-23', '14:00:00', '2025-09-11 13:53:50', 0);

-- --------------------------------------------------------

--
-- Table structure for table `arbitration_documentation`
--

CREATE TABLE `arbitration_documentation` (
  `id` int(11) NOT NULL,
  `arbitration_id` int(11) NOT NULL,
  `file_path` varchar(500) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `arbitration_reschedule`
--

CREATE TABLE `arbitration_reschedule` (
  `id` int(11) NOT NULL,
  `arbitration_id` int(11) NOT NULL,
  `reschedule_date` date NOT NULL,
  `reschedule_time` time NOT NULL,
  `minutes` text DEFAULT NULL,
  `reason` varchar(255) DEFAULT 'Initial session',
  `documentation_id` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`documentation_id`)),
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `arbitration_reschedule`
--

INSERT INTO `arbitration_reschedule` (`id`, `arbitration_id`, `reschedule_date`, `reschedule_time`, `minutes`, `reason`, `documentation_id`, `created_at`) VALUES
(24, 51, '2025-09-12', '08:00:00', NULL, 'hehe', NULL, '2025-09-10 08:33:36');

-- --------------------------------------------------------

--
-- Table structure for table `complaints`
--

CREATE TABLE `complaints` (
  `id` int(11) NOT NULL,
  `case_title` varchar(255) DEFAULT NULL,
  `case_description` text DEFAULT NULL,
  `nature_of_case` varchar(255) DEFAULT NULL,
  `relief_description` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `status` varchar(50) DEFAULT 'pending',
  `date_filed` datetime DEFAULT current_timestamp(),
  `date_withdrawn` datetime DEFAULT NULL,
  `user_id` int(11) DEFAULT NULL,
  `complainant_id` int(11) DEFAULT NULL,
  `respondent_id` int(11) DEFAULT NULL,
  `witness_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `complaints`
--

INSERT INTO `complaints` (`id`, `case_title`, `case_description`, `nature_of_case`, `relief_description`, `created_at`, `status`, `date_filed`, `date_withdrawn`, `user_id`, `complainant_id`, `respondent_id`, `witness_id`) VALUES
(2025001, 'Giving assistance to suicide', 'je', 'persons', 'je', '2025-09-10 08:22:57', 'Arbitration', '2025-09-10 16:22:57', NULL, NULL, 18, 10, NULL),
(2025002, 'Swindling a minor', 'je', 'property', 'je', '2025-09-10 08:23:07', 'Conciliation', '2025-09-10 16:23:07', NULL, NULL, 18, 13, NULL),
(2025003, 'Swindling a minor', 'je', 'property', 'je', '2025-09-10 08:23:18', 'Arbitration', '2025-09-10 16:23:18', NULL, NULL, 13, 13, NULL),
(2025004, 'Giving assistance to suicide', 'hehe', 'persons', 'je', '2025-09-10 08:51:16', 'Conciliation', '2025-09-10 16:51:16', NULL, NULL, 18, 10, NULL),
(2025005, 'Less serious physical injuries', 'jej', 'persons', 'je', '2025-09-10 08:53:02', 'Conciliation', '2025-09-10 16:53:02', NULL, NULL, 18, 10, NULL),
(2025006, 'Light coercion', 'je', 'liberty_security', 'je', '2025-09-10 09:00:32', 'Conciliation', '2025-09-10 17:00:32', NULL, NULL, 18, 10, NULL),
(2025007, 'Less serious physical injuries', 'he', 'persons', 'he', '2025-09-10 09:02:12', 'Arbitration', '2025-09-10 17:02:12', NULL, NULL, 18, 10, NULL),
(2025008, 'Giving assistance to suicide', 'je', 'persons', 'je', '2025-09-10 09:03:06', 'Arbitration', '2025-09-10 17:03:06', NULL, NULL, 18, 10, NULL),
(2025009, 'Using false certificate', 'jerl', 'public_interest', 'jerlad', '2025-09-10 09:04:53', 'Arbitration', '2025-09-10 17:04:53', NULL, NULL, 1, 1, NULL),
(2025010, 'Less serious physical injuries', 'jeje', 'persons', 'jeje', '2025-09-11 06:36:03', 'Settled', '2025-09-11 14:36:03', NULL, NULL, 18, 18, NULL),
(2025011, 'Physical injuries inflicted by tumultuous affray', 'dsadsadsa', 'persons', 'sdadsad', '2025-09-11 13:56:21', 'Settled', '2025-09-11 21:56:21', NULL, 11, 1, 1, 14),
(2025012, 'Physical injuries inflicted by tumultuous affray', 'dsadsa', 'persons', 'sdadsadsa', '2025-09-11 14:10:28', 'Conciliation', '2025-09-11 22:10:28', NULL, NULL, 10, 1, 1),
(2025013, 'Alarms and scandals', 'dsadsadas', 'public_interest', 'sdasdadsasad', '2025-09-11 14:10:51', 'Mediation', '2025-09-11 22:10:51', NULL, NULL, 1, 1, 1),
(2025014, 'Light threats', 'dsadsadsa', 'liberty_security', 'dsadsadsa', '2025-09-11 14:12:49', 'Settled', '2025-09-11 22:12:49', NULL, 11, 1, 14, 22),
(2025015, 'Abandoning a minor', 'dsadsadsads', 'liberty_security', 'dsadasdsaasds', '2025-09-11 14:21:14', 'Settled', '2025-09-11 22:21:14', NULL, 14, 22, 22, 22),
(2025016, 'Giving assistance to suicide', 'dsadsadas', 'persons', 'dsadsadsda', '2025-09-11 14:28:02', 'Settled', '2025-09-11 22:28:02', NULL, 14, 18, 18, 18),
(2025017, 'Less serious physical injuries', 'dsadsada', 'persons', 'dsassdasdasda', '2025-09-14 14:19:21', 'Settled', '2025-09-14 22:19:21', NULL, 14, 18, 10, 14),
(2025019, 'Giving assistance to suicide', 'sdaasdasdasdd', 'persons', 'dsadsaasdasd', '2025-09-15 02:03:37', 'Settled', '2025-09-15 10:03:37', NULL, 11, 1, 14, 14),
(2025020, 'Giving assistance to suicide', 'dsadasassda', 'persons', 'sadsadsadsda', '2025-09-15 02:08:07', 'Settled', '2025-09-15 10:08:07', NULL, 11, 1, 14, 14),
(2025021, 'Less serious physical injuries', 'sdasadsadsda', 'persons', 'dsasdasadsda', '2025-09-15 02:13:08', 'Settled', '2025-09-15 10:13:08', NULL, 11, 1, 14, 14),
(2025022, 'Physical injuries inflicted by tumultuous affray', 'dsasdasdasda', 'persons', 'dsasdsdasad', '2025-09-15 10:43:38', 'Settled', '2025-09-15 18:43:38', NULL, 11, 10, 14, 14),
(2025023, 'Physical injuries inflicted by tumultuous affray', 'sdasdasda', 'persons', 'dsadsadsadas', '2025-09-15 10:44:32', 'Mediation', '2025-09-15 18:44:32', NULL, NULL, 1, 1, 1),
(2025024, 'Swindling a minor', 'dsasdadsadsadas', 'property', 'dassdsd', '2025-09-15 10:49:52', 'pending', '2025-09-15 18:49:52', NULL, 11, 1, 14, 15),
(2025025, 'Physical injuries inflicted by tumultuous affray', 'dsadaas', 'persons', 'dssdadsasda', '2025-09-15 10:50:24', 'pending', '2025-09-15 18:50:24', NULL, NULL, 1, 1, 1),
(2025026, 'Light threats', 'dssdasdasda', 'liberty_security', 'dsasdsdasda', '2025-09-15 10:58:21', 'Mediation', '2025-09-15 18:58:21', NULL, 14, 14, 18, 18),
(2025027, 'Altering boundaries or landmarks', 'hehe', 'property', 'hehe', '2025-09-16 04:24:08', 'pending', '2025-09-16 12:24:08', NULL, NULL, 18, 13, 9),
(2025030, 'Physical injuries inflicted by tumultuous affray', 'dsaasdsda', 'persons', 'sdasda', '2025-09-16 10:01:14', 'withdrawn', '2025-09-16 18:01:14', '2025-09-16 19:06:10', NULL, NULL, NULL, NULL),
(2025031, 'Using false certificate', 'dsasdasda', 'public_interest', 'sdasda', '2025-09-16 11:10:07', 'Mediation', '2025-09-16 19:10:07', NULL, NULL, 7, 14, 14);

-- --------------------------------------------------------

--
-- Table structure for table `conciliation`
--

CREATE TABLE `conciliation` (
  `id` int(11) NOT NULL,
  `complaint_id` int(11) DEFAULT NULL,
  `date` date DEFAULT NULL,
  `time` time DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `lupon_panel` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `conciliation`
--

INSERT INTO `conciliation` (`id`, `complaint_id`, `date`, `time`, `created_at`, `lupon_panel`) VALUES
(23, 2025003, '2025-09-11', '11:00:00', '2025-09-10 16:24:07', '[\"MARIO J. LENDO\",\"MATCHO O. BAGUIO\",\"SOLITARIO P. YANGCO\"]'),
(24, 2025002, '2025-09-15', '10:00:00', '2025-09-10 16:34:13', '[\"MARIO J. LENDO\",\"LEONARDO A. LEOLIGAO\",\"SOLITARIO P. YANGCO\"]'),
(32, 2025012, '2025-09-15', '11:00:00', '2025-09-15 23:12:15', '[\"MARCIAL O. BENTAZAL\",\"SOLITARIO P. YANGCO\",\"EPIFANIO B. SUMALINOG\"]');

-- --------------------------------------------------------

--
-- Table structure for table `conciliation_documentation`
--

CREATE TABLE `conciliation_documentation` (
  `id` int(11) NOT NULL,
  `conciliation_id` int(11) NOT NULL,
  `file_path` varchar(500) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='Stores file paths for uploaded documents related to conciliation sessions';

-- --------------------------------------------------------

--
-- Table structure for table `conciliation_reschedule`
--

CREATE TABLE `conciliation_reschedule` (
  `id` int(11) NOT NULL,
  `conciliation_id` int(11) NOT NULL,
  `reschedule_date` date NOT NULL,
  `reschedule_time` time NOT NULL,
  `reason` varchar(500) DEFAULT NULL,
  `minutes` text DEFAULT NULL,
  `documentation_id` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`documentation_id`)),
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='Stores reschedule history and session details for conciliation cases';

--
-- Dumping data for table `conciliation_reschedule`
--

INSERT INTO `conciliation_reschedule` (`id`, `conciliation_id`, `reschedule_date`, `reschedule_time`, `reason`, `minutes`, `documentation_id`, `created_at`) VALUES
(40, 23, '2025-09-11', '11:00:00', 'Rescheduled by admin', NULL, NULL, '2025-09-10 08:26:15');

-- --------------------------------------------------------

--
-- Table structure for table `lupon_chairperson`
--

CREATE TABLE `lupon_chairperson` (
  `id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `status` enum('Active','Inactive') DEFAULT 'Active',
  `date_added` date NOT NULL DEFAULT curdate()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `lupon_chairperson`
--

INSERT INTO `lupon_chairperson` (`id`, `name`, `status`, `date_added`) VALUES
(4, 'HON. ATTY. ARTHUR L. DEGAMO', 'Active', '2025-07-03');

-- --------------------------------------------------------

--
-- Table structure for table `lupon_members`
--

CREATE TABLE `lupon_members` (
  `id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `status` enum('Active','Inactive') DEFAULT 'Active',
  `date_added` date NOT NULL DEFAULT curdate()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `lupon_members`
--

INSERT INTO `lupon_members` (`id`, `name`, `status`, `date_added`) VALUES
(6, 'JOSE C. ESTREMOS', 'Active', '2025-07-03'),
(7, 'LEONARDO A. LEOLIGAO', 'Active', '2025-07-03'),
(8, 'MARIO J. LENDO', 'Active', '2025-07-03'),
(9, 'MATCHO O. BAGUIO', 'Active', '2025-07-03'),
(10, 'FILOTEA Z. JUBAY', 'Active', '2025-07-03'),
(11, 'DOMINGA B. SARAUM', 'Active', '2025-07-03'),
(12, 'EPIFANIO B. SUMALINOG', 'Active', '2025-07-03'),
(13, 'MARCIAL O. BENTAZAL', 'Active', '2025-07-03'),
(14, 'SOLITARIO P. YANGCO', 'Active', '2025-07-03'),
(15, 'ABRAHAM R. HATAE JR.', 'Active', '2025-07-03');

-- --------------------------------------------------------

--
-- Table structure for table `lupon_secretary`
--

CREATE TABLE `lupon_secretary` (
  `id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `status` enum('Active','Inactive') DEFAULT 'Active',
  `date_added` date NOT NULL DEFAULT curdate()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `lupon_secretary`
--

INSERT INTO `lupon_secretary` (`id`, `name`, `status`, `date_added`) VALUES
(4, 'TESSIE B. CABALHUG', 'Active', '2025-07-03');

-- --------------------------------------------------------

--
-- Table structure for table `mediation`
--

CREATE TABLE `mediation` (
  `id` int(11) NOT NULL,
  `complaint_id` int(11) DEFAULT NULL,
  `date` date DEFAULT NULL,
  `time` time DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `is_deleted` tinyint(1) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `mediation`
--

INSERT INTO `mediation` (`id`, `complaint_id`, `date`, `time`, `created_at`, `is_deleted`) VALUES
(127, 2025003, '2025-09-11', '09:00:00', '2025-09-10 16:23:28', 0),
(128, 2025002, '2025-09-15', '09:00:00', '2025-09-10 16:33:49', 0),
(129, 2025001, '2025-09-16', '09:00:00', '2025-09-10 16:38:37', 1),
(130, 2025004, '2025-09-17', '09:00:00', '2025-09-10 16:51:26', 1),
(131, 2025005, '2025-09-18', '09:00:00', '2025-09-10 16:53:13', 1),
(132, 2025006, '2025-09-18', '09:00:00', '2025-09-10 17:00:41', 1),
(133, 2025007, '2025-09-19', '09:00:00', '2025-09-10 17:02:20', 1),
(134, 2025008, '2025-09-22', '09:00:00', '2025-09-10 17:03:16', 1),
(135, 2025009, '2025-09-23', '09:00:00', '2025-09-10 17:05:02', 1),
(136, 2025010, '2025-09-18', '08:00:00', '2025-09-11 14:36:13', 0),
(137, 2025011, '2025-09-11', '13:00:00', '2025-09-11 22:11:24', 0),
(138, 2025014, '2025-09-18', '09:00:00', '2025-09-11 22:13:15', 0),
(139, 2025015, '2025-09-12', '09:00:00', '2025-09-11 22:23:11', 0),
(140, 2025016, '2025-09-16', '09:00:00', '2025-09-14 21:45:44', 0),
(141, 2025013, '2025-09-16', '10:00:00', '2025-09-14 21:45:50', 0),
(142, 2025012, '2025-09-16', '11:00:00', '2025-09-14 21:45:59', 1),
(143, 2025017, '2025-09-15', '13:00:00', '2025-09-14 22:20:16', 0),
(144, 2025019, '2025-09-16', '13:00:00', '2025-09-15 10:06:49', 0),
(145, 2025020, '2025-09-25', '11:00:00', '2025-09-15 10:12:28', 0),
(146, 2025021, '2025-09-25', '13:00:00', '2025-09-15 10:38:31', 0),
(147, 2025023, '2025-09-18', '11:00:00', '2025-09-15 18:45:15', 0),
(148, 2025022, '2025-09-18', '13:00:00', '2025-09-15 18:45:49', 0),
(149, 2025026, '2025-09-23', '10:00:00', '2025-09-15 21:25:10', 0),
(150, 2025030, '2025-09-17', '11:00:00', '2025-09-16 18:05:13', 0),
(151, 2025031, '2025-09-17', '10:00:00', '2025-09-16 19:10:31', 0);

-- --------------------------------------------------------

--
-- Table structure for table `mediation_documentation`
--

CREATE TABLE `mediation_documentation` (
  `id` int(11) NOT NULL,
  `mediation_id` int(11) DEFAULT NULL,
  `file_path` varchar(255) DEFAULT NULL,
  `uploaded_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `mediation_documentation`
--

INSERT INTO `mediation_documentation` (`id`, `mediation_id`, `file_path`, `uploaded_at`) VALUES
(25, 137, 'uploads/mediation/mediation-1757599913994-517479539.jpg', '2025-09-11 22:11:54');

-- --------------------------------------------------------

--
-- Table structure for table `mediation_reschedule`
--

CREATE TABLE `mediation_reschedule` (
  `id` int(11) NOT NULL,
  `mediation_id` int(11) NOT NULL,
  `reschedule_date` date DEFAULT NULL,
  `reschedule_time` time DEFAULT NULL,
  `reason` text DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `minutes` text DEFAULT NULL,
  `documentation_id` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `mediation_reschedule`
--

INSERT INTO `mediation_reschedule` (`id`, `mediation_id`, `reschedule_date`, `reschedule_time`, `reason`, `created_at`, `minutes`, `documentation_id`) VALUES
(43, 127, '2025-09-11', '09:00:00', '', '2025-09-10 16:23:46', NULL, NULL),
(44, 128, '2025-09-15', '09:00:00', '', '2025-09-10 16:34:00', NULL, NULL),
(45, 129, '2025-09-16', '09:00:00', '', '2025-09-10 16:38:44', NULL, NULL),
(46, 130, '2025-09-17', '09:00:00', '', '2025-09-10 16:51:33', NULL, NULL),
(47, 131, '2025-09-18', '09:00:00', '', '2025-09-10 16:53:21', NULL, NULL),
(48, 132, '2025-09-18', '09:00:00', '', '2025-09-10 17:00:47', NULL, NULL),
(49, 133, '2025-09-19', '09:00:00', '', '2025-09-10 17:02:27', NULL, NULL),
(50, 134, '2025-09-22', '09:00:00', '', '2025-09-10 17:03:25', NULL, NULL),
(51, 135, '2025-09-23', '09:00:00', 'dsadsadsa', '2025-09-10 17:05:26', NULL, NULL),
(52, 136, '2025-09-11', '16:00:00', 'jee', '2025-09-11 16:44:17', 'hehe', NULL),
(53, 137, '2025-09-11', '13:00:00', 'Initial session', '2025-09-11 22:11:54', 'dsadadsadsadasdasdsadsadad', '[25]'),
(54, 136, '2025-09-18', '08:00:00', 'dsadsad', '2025-09-11 22:18:43', NULL, NULL),
(55, 138, '2025-09-18', '09:00:00', 'dsadsadaasd', '2025-09-11 22:18:57', NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `notifications`
--

CREATE TABLE `notifications` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `complaint_id` int(11) DEFAULT NULL,
  `referral_id` int(11) DEFAULT NULL,
  `type` enum('case_accepted','mediation_scheduled','conciliation_scheduled','arbitration_scheduled','case_settled','case_transferred','session_rescheduled','case_withdrawn','case_for_approval','payment_pending','payment_success','payment_completed') NOT NULL,
  `title` varchar(255) NOT NULL,
  `message` text NOT NULL,
  `is_read` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `notifications`
--

INSERT INTO `notifications` (`id`, `user_id`, `complaint_id`, `referral_id`, `type`, `title`, `message`, `is_read`, `created_at`, `updated_at`) VALUES
(56, 11, NULL, NULL, 'case_withdrawn', 'Case Withdrawn', 'The case \"Threatening to publish and offer to prevent such publication for compensation\" has been withdrawn.', 1, '2025-08-19 05:59:07', '2025-08-19 05:59:51'),
(57, 11, NULL, NULL, 'mediation_scheduled', 'Mediation Scheduled', 'Your case \"Light threats\" has been scheduled for mediation. Please check your dashboard for details.', 1, '2025-08-19 06:56:39', '2025-08-20 06:45:52'),
(58, 11, NULL, NULL, 'session_rescheduled', 'Session Rescheduled', 'A session for your case \"Light threats\" has been rescheduled. Please check your dashboard for the new schedule.', 1, '2025-08-20 03:28:48', '2025-08-20 06:45:52'),
(59, 14, NULL, NULL, 'mediation_scheduled', 'Mediation Scheduled', 'Your case \"Less serious physical injuries\" has been scheduled for mediation. Please check your dashboard for details.', 1, '2025-08-20 04:01:03', '2025-08-20 04:52:48'),
(60, 11, NULL, NULL, 'mediation_scheduled', 'Mediation Scheduled', 'Your case \"Abandonment of persons in danger and abandonment of one\'s own victim\" has been scheduled for mediation. Please check your dashboard for details.', 1, '2025-08-20 04:41:08', '2025-08-20 06:45:52'),
(61, 14, NULL, NULL, '', 'Payment Required - Case Under Review', 'Your complaint (Case #2025011) has been filed successfully. Since you selected onsite payment, your case is currently under review and pending payment. Please visit our office to complete the payment process to proceed with your case.', 1, '2025-08-20 04:58:43', '2025-08-20 05:02:10'),
(62, 14, NULL, NULL, '', 'Payment Required - Case Under Review', 'Your complaint (Case #2025012) has been filed successfully. Since you selected onsite payment, your case is currently under review and pending payment. Please visit our office to complete the payment process to proceed with your case.', 1, '2025-08-20 05:02:59', '2025-08-20 05:05:08'),
(63, 14, NULL, NULL, '', 'Payment Required - Case Under Review', 'Your complaint (Case #2025013) has been filed successfully. Since you selected onsite payment, your case is currently under review and pending payment. Please visit our office to complete the payment process to proceed with your case.', 1, '2025-08-20 05:05:21', '2025-08-20 05:05:26'),
(64, 14, NULL, NULL, '', 'Payment Required - Case Under Review', 'Your complaint (Case #2025014) has been filed successfully. Since you selected onsite payment, your case is currently under review and pending payment. Please visit our office to complete the payment process to proceed with your case.', 1, '2025-08-20 05:08:09', '2025-08-20 05:17:39'),
(65, 14, NULL, NULL, '', 'Payment Required - Case Under Review', 'Your complaint (Case #2025015) has been filed successfully. Since you selected onsite payment, your case is currently under review and pending payment. Please visit our office to complete the payment process to proceed with your case.', 1, '2025-08-20 05:21:59', '2025-08-20 05:22:02'),
(66, 14, NULL, NULL, 'mediation_scheduled', 'Mediation Scheduled', 'Your case \"Abandoning a minor\" has been scheduled for mediation. Please check your dashboard for details.', 1, '2025-08-20 05:23:12', '2025-08-20 05:23:16'),
(67, 14, NULL, NULL, '', 'Payment Required - Case Under Review', 'Your complaint (Case #2025016) has been filed successfully. Since you selected onsite payment, your case is currently under review and pending payment. Please visit our office to complete the payment process to proceed with your case.', 1, '2025-08-20 05:24:10', '2025-08-20 05:24:21'),
(68, 14, NULL, NULL, 'mediation_scheduled', 'Mediation Scheduled', 'Your case \"Light coercion\" has been scheduled for mediation. Please check your dashboard for details.', 1, '2025-08-20 05:24:40', '2025-08-20 05:24:46'),
(69, 14, NULL, NULL, '', 'Payment Successful - Complaint Filed', 'Your complaint (Case #2025020) has been filed successfully! Your payment via QR scan has been completed and verified. Your case is now in the system and will be processed accordingly. Thank you for using our online payment service.', 1, '2025-08-20 05:37:41', '2025-08-20 05:37:46'),
(70, 14, NULL, NULL, 'mediation_scheduled', 'Mediation Scheduled', 'Your case \"Less serious physical injuries\" has been scheduled for mediation. Please check your dashboard for details.', 1, '2025-08-20 05:42:04', '2025-08-20 05:42:08'),
(71, 14, NULL, NULL, '', 'Payment Required - Case Under Review', 'Your complaint (Case #2025021) has been filed successfully. Since you selected onsite payment, your case is currently under review and pending payment. Please visit our office to complete the payment process to proceed with your case.', 1, '2025-08-20 05:53:05', '2025-08-20 05:53:09'),
(72, 14, NULL, NULL, '', 'Payment Successful - Complaint Filed', 'Your complaint (Case #2025022) has been filed successfully! Your payment via QR scan has been completed and verified. Your case is now in the system and will be processed accordingly. Thank you for using our online payment service.', 1, '2025-08-20 06:28:57', '2025-08-20 06:29:04'),
(73, 11, NULL, NULL, '', 'Payment Required - Case Under Review', 'Your complaint (Case #2025023) has been filed successfully. Since you selected onsite payment, your case is currently under review and pending payment. Please visit our office to complete the payment process to proceed with your case.', 1, '2025-08-20 06:46:18', '2025-08-20 06:46:32'),
(74, 11, NULL, NULL, 'mediation_scheduled', 'Mediation Scheduled', 'Your case \"Using false certificate\" has been scheduled for mediation. Please check your dashboard for details.', 1, '2025-08-20 06:46:40', '2025-08-20 06:46:45'),
(75, 14, NULL, NULL, '', 'Payment Required - Case Under Review', 'Your complaint (Case #2025024) has been filed successfully. Since you selected onsite payment, your case is currently under review and pending payment. Please visit our office to complete the payment process to proceed with your case.', 1, '2025-08-20 07:12:27', '2025-08-20 07:12:30'),
(76, 11, NULL, NULL, '', 'Payment Successful - Complaint Filed', 'Your complaint (Case #2025025) has been filed successfully! Your payment via QR scan has been completed and verified. Your case is now in the system and will be processed accordingly. Thank you for using our online payment service.', 1, '2025-08-20 15:38:26', '2025-08-20 15:38:37'),
(77, 11, NULL, NULL, '', 'Payment Required - Case Under Review', 'Your complaint (Case #2025026) has been filed successfully. Since you selected onsite payment, your case is currently under review and pending payment. Please visit our office to complete the payment process to proceed with your case.', 1, '2025-08-21 07:41:59', '2025-08-21 08:20:31'),
(78, 11, NULL, NULL, '', 'Payment Required - Case Under Review', 'Your complaint (Case #2025027) has been filed successfully. Since you selected onsite payment, your case is currently under review and pending payment. Please visit our office to complete the payment process to proceed with your case.', 1, '2025-08-21 08:20:55', '2025-08-21 08:21:08'),
(79, 11, NULL, NULL, '', 'Payment Successful - Complaint Filed', 'Your complaint (Case #2025028) has been filed successfully! Your payment via QR scan has been completed and verified. Your case is now in the system and will be processed accordingly. Thank you for using our online payment service.', 1, '2025-08-21 08:49:19', '2025-08-21 09:28:32'),
(80, 11, NULL, NULL, 'mediation_scheduled', 'Mediation Scheduled', 'Your case \"Light threats\" has been scheduled for mediation. Please check your dashboard for details.', 1, '2025-08-21 08:49:32', '2025-08-21 09:28:32'),
(81, 11, NULL, NULL, '', 'Payment Required - Case Under Review', 'Your complaint (Case #2025030) has been filed successfully. Since you selected onsite payment, your case is currently under review and pending payment. Please visit our office to complete the payment process to proceed with your case.', 1, '2025-08-21 09:28:52', '2025-08-21 09:29:02'),
(82, 11, NULL, NULL, 'mediation_scheduled', 'Mediation Scheduled', 'Your case \"Giving assistance to suicide\" has been scheduled for mediation. Please check your dashboard for details.', 1, '2025-08-21 09:29:37', '2025-08-21 09:29:41'),
(83, 11, NULL, NULL, 'case_transferred', 'Case Transferred', 'Your case \"Using false certificate\" has been transferred to bangbang for further processing. You may need to follow up directly with the receiving agency.', 1, '2025-08-22 13:50:56', '2025-08-22 13:54:01'),
(84, 11, NULL, NULL, 'case_transferred', 'Case Transferred', 'Your case \"Using false certificate\" has been transferred to bangbang for further processing. You may need to follow up directly with the receiving agency.', 1, '2025-08-22 13:50:56', '2025-08-22 13:54:01'),
(85, 11, NULL, NULL, '', 'Payment Required - Case Under Review', 'Your complaint (Case #2025032) has been filed successfully. Since you selected onsite payment, your case is currently under review and pending payment. Please visit our office to complete the payment process to proceed with your case.', 1, '2025-08-22 13:55:14', '2025-08-22 13:55:19'),
(86, 11, NULL, NULL, '', 'Payment Required - Case Under Review', 'Your complaint (Case #2025037) has been filed successfully. Since you selected onsite payment, your case is currently under review and pending payment. Please visit our office to complete the payment process to proceed with your case.', 1, '2025-08-22 14:21:51', '2025-08-22 14:44:37'),
(87, 11, NULL, NULL, 'mediation_scheduled', 'Mediation Scheduled', 'Your case \"Using false certificate\" has been scheduled for mediation. Please check your dashboard for details.', 1, '2025-08-22 14:44:52', '2025-08-22 14:44:56'),
(88, 14, NULL, NULL, '', 'Payment Required - Case Under Review', 'Your complaint (Case #2025040) has been filed successfully. Since you selected onsite payment, your case is currently under review and pending payment. Please visit our office to complete the payment process to proceed with your case.', 1, '2025-08-23 06:40:26', '2025-08-23 06:41:04'),
(89, 5, NULL, NULL, 'case_for_approval', 'New Case for Approval', 'A new complaint (Case #2025041) has been filed and requires approval. Please review the case details in the Cases for Approval section.', 1, '2025-08-23 06:42:07', '2025-08-23 07:18:10'),
(90, 6, NULL, NULL, 'case_for_approval', 'New Case for Approval', 'A new complaint (Case #2025041) has been filed and requires approval. Please review the case details in the Cases for Approval section.', 0, '2025-08-23 06:42:07', '2025-08-23 07:16:16'),
(91, 5, NULL, NULL, 'case_for_approval', 'New Case for Approval', 'A new complaint (Case #2025042) has been filed and requires approval. Please review the case details in the Cases for Approval section.', 1, '2025-08-23 06:47:01', '2025-08-23 07:18:10'),
(92, 6, NULL, NULL, 'case_for_approval', 'New Case for Approval', 'A new complaint (Case #2025042) has been filed and requires approval. Please review the case details in the Cases for Approval section.', 0, '2025-08-23 06:47:01', '2025-08-23 07:16:16'),
(93, 5, NULL, NULL, 'case_for_approval', 'New Case for Approval', 'A new complaint (Case #2025043) has been filed and requires approval. Please review the case details in the Cases for Approval section.', 1, '2025-08-23 06:53:25', '2025-08-23 07:18:10'),
(94, 6, NULL, NULL, 'case_for_approval', 'New Case for Approval', 'A new complaint (Case #2025043) has been filed and requires approval. Please review the case details in the Cases for Approval section.', 0, '2025-08-23 06:53:25', '2025-08-23 07:16:16'),
(95, 14, NULL, NULL, '', 'Payment Required - Case Under Review', 'Your complaint (Case #2025044) has been filed successfully. Since you selected onsite payment, your case is currently under review and pending payment. Please visit our office to complete the payment process to proceed with your case.', 1, '2025-08-23 06:53:44', '2025-08-23 07:21:12'),
(96, 5, NULL, NULL, 'case_for_approval', 'New Case for Approval', 'A new complaint (Case #2025044) has been filed and requires approval. Please review the case details in the Cases for Approval section.', 1, '2025-08-23 06:53:44', '2025-08-23 07:18:10'),
(97, 6, NULL, NULL, 'case_for_approval', 'New Case for Approval', 'A new complaint (Case #2025044) has been filed and requires approval. Please review the case details in the Cases for Approval section.', 0, '2025-08-23 06:53:44', '2025-08-23 07:16:16'),
(98, 5, NULL, NULL, 'case_for_approval', 'New Case for Approval', 'A new complaint (Case #2025045) has been filed and requires approval. Please review the case details in the Cases for Approval section.', 1, '2025-08-23 06:54:13', '2025-08-23 07:18:10'),
(99, 6, NULL, NULL, 'case_for_approval', 'New Case for Approval', 'A new complaint (Case #2025045) has been filed and requires approval. Please review the case details in the Cases for Approval section.', 0, '2025-08-23 06:54:13', '2025-08-23 07:16:16'),
(100, 5, NULL, NULL, 'case_for_approval', 'New Case for Approval', 'A new complaint (Case #2025046) has been filed and requires approval. Please review the case details in the Cases for Approval section.', 1, '2025-08-23 07:18:25', '2025-08-23 07:18:30'),
(101, 6, NULL, NULL, 'case_for_approval', 'New Case for Approval', 'A new complaint (Case #2025046) has been filed and requires approval. Please review the case details in the Cases for Approval section.', 0, '2025-08-23 07:18:25', '2025-08-23 07:18:25'),
(102, 14, NULL, NULL, 'payment_pending', 'Payment Required - Case Under Review', 'Your complaint (Case #2025047) has been filed successfully. Since you selected onsite payment, your case is currently under review and pending payment. Please visit our office to complete the payment process to proceed with your case.', 1, '2025-08-23 07:21:28', '2025-08-23 07:21:31'),
(103, 5, NULL, NULL, 'case_for_approval', 'New Case for Approval', 'A new complaint (Case #2025047) has been filed and requires approval. Please review the case details in the Cases for Approval section.', 1, '2025-08-23 07:21:28', '2025-08-23 07:21:33'),
(104, 6, NULL, NULL, 'case_for_approval', 'New Case for Approval', 'A new complaint (Case #2025047) has been filed and requires approval. Please review the case details in the Cases for Approval section.', 0, '2025-08-23 07:21:28', '2025-08-23 07:21:28'),
(105, 5, NULL, NULL, 'case_for_approval', 'New Case for Approval', 'A new complaint (Case #2025048) has been filed and requires approval. Please review the case details in the Cases for Approval section.', 1, '2025-08-23 07:28:06', '2025-08-23 07:28:46'),
(106, 6, NULL, NULL, 'case_for_approval', 'New Case for Approval', 'A new complaint (Case #2025048) has been filed and requires approval. Please review the case details in the Cases for Approval section.', 0, '2025-08-23 07:28:06', '2025-08-23 07:28:06'),
(107, 5, NULL, NULL, 'case_for_approval', 'New Case for Approval', 'A new complaint (Case #2025049) has been filed and requires approval. Please review the case details in the Cases for Approval section.', 1, '2025-08-23 07:28:40', '2025-08-23 07:28:46'),
(108, 6, NULL, NULL, 'case_for_approval', 'New Case for Approval', 'A new complaint (Case #2025049) has been filed and requires approval. Please review the case details in the Cases for Approval section.', 0, '2025-08-23 07:28:40', '2025-08-23 07:28:40'),
(109, 5, NULL, NULL, 'case_for_approval', 'New Case for Approval', 'A new complaint (Case #2025050) has been filed and requires approval. Please review the case details in the Cases for Approval section.', 1, '2025-08-25 10:20:23', '2025-08-25 10:20:33'),
(110, 6, NULL, NULL, 'case_for_approval', 'New Case for Approval', 'A new complaint (Case #2025050) has been filed and requires approval. Please review the case details in the Cases for Approval section.', 0, '2025-08-25 10:20:23', '2025-08-25 10:20:23'),
(111, 5, NULL, NULL, 'case_for_approval', 'New Case for Approval', 'A new complaint (Case #2025051) has been filed and requires approval. Please review the case details in the Cases for Approval section.', 1, '2025-08-25 10:32:55', '2025-08-25 10:33:00'),
(112, 6, NULL, NULL, 'case_for_approval', 'New Case for Approval', 'A new complaint (Case #2025051) has been filed and requires approval. Please review the case details in the Cases for Approval section.', 0, '2025-08-25 10:32:55', '2025-08-25 10:32:55'),
(113, 5, NULL, NULL, 'case_for_approval', 'New Case for Approval', 'A new complaint (Case #2025052) has been filed and requires approval. Please review the case details in the Cases for Approval section.', 1, '2025-08-26 03:46:38', '2025-08-26 03:46:44'),
(114, 6, NULL, NULL, 'case_for_approval', 'New Case for Approval', 'A new complaint (Case #2025052) has been filed and requires approval. Please review the case details in the Cases for Approval section.', 0, '2025-08-26 03:46:38', '2025-08-26 03:46:38'),
(115, 11, NULL, NULL, 'case_settled', 'Case Settled', 'Your case \"Light threats\" has been successfully settled.', 1, '2025-08-26 05:12:51', '2025-09-04 08:17:37'),
(116, 11, NULL, NULL, 'case_settled', 'Case Settled', 'Your case \"Abandonment of persons in danger and abandonment of one\'s own victim\" has been successfully settled.', 1, '2025-08-26 05:16:32', '2025-09-04 08:17:37'),
(117, 14, NULL, NULL, 'case_settled', 'Case Settled', 'Your case \"Less serious physical injuries\" has been successfully settled.', 1, '2025-08-26 05:19:10', '2025-09-11 14:20:49'),
(118, 14, NULL, NULL, 'case_settled', 'Case Settled', 'Your case \"Abandoning a minor\" has been successfully settled.', 1, '2025-08-26 05:20:56', '2025-09-11 14:20:49'),
(119, 14, NULL, NULL, 'case_settled', 'Case Settled', 'Your case \"Light coercion\" has been successfully settled.', 1, '2025-08-26 05:21:11', '2025-09-11 14:20:49'),
(120, 14, NULL, NULL, 'case_settled', 'Case Settled', 'Your case \"Less serious physical injuries\" has been successfully settled.', 1, '2025-08-28 06:47:45', '2025-09-11 14:20:49'),
(121, 11, NULL, NULL, 'case_settled', 'Case Settled', 'Your case \"Using false certificate\" has been successfully settled.', 1, '2025-08-28 07:28:12', '2025-09-04 08:17:37'),
(122, 11, NULL, NULL, 'case_settled', 'Case Settled', 'Your case \"Light threats\" has been successfully settled.', 1, '2025-08-28 07:32:10', '2025-09-04 08:17:37'),
(123, 11, NULL, NULL, 'case_settled', 'Case Settled', 'Your case \"Giving assistance to suicide\" has been successfully settled.', 1, '2025-08-28 07:33:04', '2025-09-04 08:17:37'),
(124, 11, NULL, NULL, 'case_settled', 'Case Settled', 'Your case \"Using false certificate\" has been successfully settled.', 1, '2025-08-28 07:36:15', '2025-09-04 08:17:37'),
(125, 14, NULL, NULL, 'mediation_scheduled', 'Mediation Scheduled', 'Your case \"Using false certificate\" has been scheduled for mediation. Please check your dashboard for details.', 1, '2025-08-28 07:47:26', '2025-09-11 14:20:49'),
(126, 14, NULL, NULL, 'arbitration_scheduled', 'Arbitration Scheduled', 'Your case \"Using false certificate\" has been scheduled for arbitration. Please check your dashboard for details.', 1, '2025-08-28 07:57:02', '2025-09-11 14:20:49'),
(127, 14, NULL, NULL, 'case_settled', 'Case Settled', 'Your case \"Using false certificate\" has been successfully settled.', 1, '2025-08-28 07:57:21', '2025-09-11 14:20:49'),
(128, 15, NULL, NULL, 'payment_pending', 'Payment Required - Case Under Review', 'Your complaint (Case #2025053) has been filed successfully. Since you selected onsite payment, your case is currently under review and pending payment. Please visit our office to complete the payment process to proceed with your case.', 0, '2025-09-01 06:17:57', '2025-09-01 06:17:57'),
(129, 5, NULL, NULL, 'case_for_approval', 'New Case for Approval', 'A new complaint (Case #2025053) has been filed and requires approval. Please review the case details in the Cases for Approval section.', 1, '2025-09-01 06:17:57', '2025-09-01 06:18:15'),
(130, 6, NULL, NULL, 'case_for_approval', 'New Case for Approval', 'A new complaint (Case #2025053) has been filed and requires approval. Please review the case details in the Cases for Approval section.', 0, '2025-09-01 06:17:57', '2025-09-01 06:17:57'),
(131, 15, NULL, NULL, 'mediation_scheduled', 'Mediation Scheduled', 'Your case \"Using fictitious name and concealing true name\" has been scheduled for mediation. Please check your dashboard for details.', 0, '2025-09-03 05:23:17', '2025-09-03 05:23:17'),
(132, 14, NULL, NULL, 'mediation_scheduled', 'Mediation Scheduled', 'Your case \"Using fictitious name and concealing true name\" has been scheduled for mediation. Please check your dashboard for details.', 1, '2025-09-03 06:11:11', '2025-09-11 14:20:49'),
(133, 14, NULL, NULL, 'mediation_scheduled', 'Mediation Scheduled', 'Your case \"Using false certificate\" has been scheduled for mediation. Please check your dashboard for details.', 1, '2025-09-03 06:20:03', '2025-09-11 14:20:49'),
(134, 11, NULL, NULL, 'mediation_scheduled', 'Mediation Scheduled', 'Your case \"Giving assistance to suicide\" has been scheduled for mediation. Please check your dashboard for details.', 1, '2025-09-04 06:39:53', '2025-09-04 08:17:37'),
(135, 11, NULL, NULL, 'mediation_scheduled', 'Mediation Scheduled', 'Your case \"Slight physical injuries and maltreatment\" has been scheduled for mediation. Please check your dashboard for details.', 1, '2025-09-04 07:45:13', '2025-09-04 08:17:37'),
(136, 11, NULL, NULL, 'mediation_scheduled', 'Mediation Scheduled', 'Your case \"Giving assistance to suicide\" has been scheduled for mediation. Please check your dashboard for details.', 1, '2025-09-04 08:35:47', '2025-09-11 13:55:47'),
(137, 11, NULL, NULL, 'mediation_scheduled', 'Mediation Scheduled', 'Your case \"Alarms and scandals\" has been scheduled for mediation. Please check your dashboard for details.', 1, '2025-09-04 08:35:53', '2025-09-11 13:55:47'),
(138, 14, NULL, NULL, 'mediation_scheduled', 'Mediation Scheduled', 'Your case \"Physical injuries inflicted by tumultuous affray\" has been scheduled for mediation. Please check your dashboard for details.', 1, '2025-09-04 08:35:59', '2025-09-11 14:20:49'),
(139, 14, NULL, NULL, 'mediation_scheduled', 'Mediation Scheduled', 'Your case \"Abandonment of persons in danger and abandonment of one\'s own victim\" has been scheduled for mediation. Please check your dashboard for details.', 1, '2025-09-04 08:36:05', '2025-09-11 14:20:49'),
(140, 14, NULL, NULL, 'mediation_scheduled', 'Mediation Scheduled', 'Your case \"Less serious physical injuries\" has been scheduled for mediation. Please check your dashboard for details.', 1, '2025-09-04 08:58:18', '2025-09-11 14:20:49'),
(141, 14, NULL, NULL, 'mediation_scheduled', 'Mediation Scheduled', 'Your case \"Physical injuries inflicted by tumultuous affray\" has been scheduled for mediation. Please check your dashboard for details.', 1, '2025-09-05 06:50:23', '2025-09-11 14:20:49'),
(142, 14, NULL, NULL, 'mediation_scheduled', 'Mediation Scheduled', 'Your case \"Giving assistance to suicide\" has been scheduled for mediation. Please check your dashboard for details.', 1, '2025-09-05 08:18:10', '2025-09-11 14:20:49'),
(143, 5, NULL, NULL, 'case_for_approval', 'New Case for Approval', 'A new complaint (Case #2025054) has been filed and requires approval. Please review the case details in the Cases for Approval section.', 1, '2025-09-05 14:40:08', '2025-09-05 14:40:13'),
(144, 6, NULL, NULL, 'case_for_approval', 'New Case for Approval', 'A new complaint (Case #2025054) has been filed and requires approval. Please review the case details in the Cases for Approval section.', 0, '2025-09-05 14:40:08', '2025-09-05 14:40:08'),
(145, 14, NULL, NULL, 'mediation_scheduled', 'Mediation Scheduled', 'Your case \"Giving assistance to suicide\" has been scheduled for mediation. Please check your dashboard for details.', 1, '2025-09-07 14:25:26', '2025-09-11 14:20:49'),
(146, 14, NULL, NULL, 'mediation_scheduled', 'Mediation Scheduled', 'Your case \"Alarms and scandals\" has been scheduled for mediation. Please check your dashboard for details.', 1, '2025-09-08 06:52:27', '2025-09-11 14:20:49'),
(147, 14, NULL, NULL, 'mediation_scheduled', 'Mediation Scheduled', 'Your case \"Giving assistance to suicide\" has been scheduled for mediation. Please check your dashboard for details.', 1, '2025-09-08 06:52:53', '2025-09-11 14:20:49'),
(148, 14, NULL, NULL, 'mediation_scheduled', 'Mediation Scheduled', 'Your case \"Alarms and scandals\" has been scheduled for mediation. Please check your dashboard for details.', 1, '2025-09-08 07:03:19', '2025-09-11 14:20:49'),
(149, 15, NULL, NULL, 'arbitration_scheduled', 'Arbitration Scheduled', 'Your case \"Using fictitious name and concealing true name\" has been scheduled for arbitration. Please check your dashboard for details.', 0, '2025-09-08 07:32:15', '2025-09-08 07:32:15'),
(150, 14, NULL, NULL, 'session_rescheduled', 'Session Rescheduled', 'A session for your case \"Using false certificate\" has been rescheduled. Please check your dashboard for the new schedule.', 1, '2025-09-08 08:04:10', '2025-09-11 14:20:49'),
(151, 14, NULL, NULL, 'arbitration_scheduled', 'Arbitration Scheduled', 'Your case \"Using fictitious name and concealing true name\" has been scheduled for arbitration. Please check your dashboard for details.', 1, '2025-09-08 09:24:27', '2025-09-11 14:20:49'),
(152, 14, NULL, NULL, 'session_rescheduled', 'Session Rescheduled', 'A session for your case \"Less serious physical injuries\" has been rescheduled. Please check your dashboard for the new schedule.', 1, '2025-09-08 09:48:21', '2025-09-11 14:20:49'),
(153, 14, NULL, NULL, 'mediation_scheduled', 'Mediation Scheduled', 'Your case \"Alarms and scandals\" has been scheduled for mediation. Please check your dashboard for details.', 1, '2025-09-08 09:52:16', '2025-09-11 14:20:49'),
(154, 5, NULL, NULL, 'case_for_approval', 'New Case for Approval', 'A new complaint (Case #2025001) has been filed and requires approval. Please review the case details in the Cases for Approval section.', 1, '2025-09-08 10:25:48', '2025-09-08 10:25:51'),
(155, 6, NULL, NULL, 'case_for_approval', 'New Case for Approval', 'A new complaint (Case #2025001) has been filed and requires approval. Please review the case details in the Cases for Approval section.', 0, '2025-09-08 10:25:48', '2025-09-08 10:25:48'),
(156, 5, NULL, NULL, 'case_for_approval', 'New Case for Approval', 'A new complaint (Case #2025002) has been filed and requires approval. Please review the case details in the Cases for Approval section.', 1, '2025-09-08 10:39:21', '2025-09-08 10:41:32'),
(157, 6, NULL, NULL, 'case_for_approval', 'New Case for Approval', 'A new complaint (Case #2025002) has been filed and requires approval. Please review the case details in the Cases for Approval section.', 0, '2025-09-08 10:39:21', '2025-09-08 10:39:21'),
(158, 5, NULL, NULL, 'case_for_approval', 'New Case for Approval', 'A new complaint (Case #2025003) has been filed and requires approval. Please review the case details in the Cases for Approval section.', 1, '2025-09-08 10:42:19', '2025-09-08 10:42:32'),
(159, 6, NULL, NULL, 'case_for_approval', 'New Case for Approval', 'A new complaint (Case #2025003) has been filed and requires approval. Please review the case details in the Cases for Approval section.', 0, '2025-09-08 10:42:19', '2025-09-08 10:42:19'),
(160, 5, NULL, NULL, 'case_for_approval', 'New Case for Approval', 'A new complaint (Case #2025004) has been filed and requires approval. Please review the case details in the Cases for Approval section.', 1, '2025-09-08 10:42:28', '2025-09-08 10:42:32'),
(161, 6, NULL, NULL, 'case_for_approval', 'New Case for Approval', 'A new complaint (Case #2025004) has been filed and requires approval. Please review the case details in the Cases for Approval section.', 0, '2025-09-08 10:42:28', '2025-09-08 10:42:28'),
(162, 5, NULL, NULL, 'case_for_approval', 'New Case for Approval', 'A new complaint (Case #2025005) has been filed and requires approval. Please review the case details in the Cases for Approval section.', 1, '2025-09-08 10:42:45', '2025-09-08 10:44:56'),
(163, 6, NULL, NULL, 'case_for_approval', 'New Case for Approval', 'A new complaint (Case #2025005) has been filed and requires approval. Please review the case details in the Cases for Approval section.', 0, '2025-09-08 10:42:46', '2025-09-08 10:42:46'),
(164, 5, NULL, NULL, 'case_for_approval', 'New Case for Approval', 'A new complaint (Case #2025006) has been filed and requires approval. Please review the case details in the Cases for Approval section.', 1, '2025-09-08 10:42:57', '2025-09-08 10:44:56'),
(165, 6, NULL, NULL, 'case_for_approval', 'New Case for Approval', 'A new complaint (Case #2025006) has been filed and requires approval. Please review the case details in the Cases for Approval section.', 0, '2025-09-08 10:42:57', '2025-09-08 10:42:57'),
(166, 5, NULL, NULL, 'case_for_approval', 'New Case for Approval', 'A new complaint (Case #2025007) has been filed and requires approval. Please review the case details in the Cases for Approval section.', 1, '2025-09-08 10:44:48', '2025-09-08 10:44:56'),
(167, 6, NULL, NULL, 'case_for_approval', 'New Case for Approval', 'A new complaint (Case #2025007) has been filed and requires approval. Please review the case details in the Cases for Approval section.', 0, '2025-09-08 10:44:48', '2025-09-08 10:44:48'),
(168, 5, NULL, NULL, 'case_for_approval', 'New Case for Approval', 'A new complaint (Case #2025008) has been filed and requires approval. Please review the case details in the Cases for Approval section.', 1, '2025-09-08 10:58:17', '2025-09-08 10:58:20'),
(169, 6, NULL, NULL, 'case_for_approval', 'New Case for Approval', 'A new complaint (Case #2025008) has been filed and requires approval. Please review the case details in the Cases for Approval section.', 0, '2025-09-08 10:58:17', '2025-09-08 10:58:17'),
(170, 5, NULL, NULL, 'case_for_approval', 'New Case for Approval', 'A new complaint (Case #2025009) has been filed and requires approval. Please review the case details in the Cases for Approval section.', 1, '2025-09-08 11:19:24', '2025-09-08 11:19:50'),
(171, 6, NULL, NULL, 'case_for_approval', 'New Case for Approval', 'A new complaint (Case #2025009) has been filed and requires approval. Please review the case details in the Cases for Approval section.', 0, '2025-09-08 11:19:24', '2025-09-08 11:19:24'),
(172, 5, NULL, NULL, 'case_for_approval', 'New Case for Approval', 'A new complaint (Case #2025010) has been filed and requires approval. Please review the case details in the Cases for Approval section.', 1, '2025-09-08 11:19:36', '2025-09-08 11:19:50'),
(173, 6, NULL, NULL, 'case_for_approval', 'New Case for Approval', 'A new complaint (Case #2025010) has been filed and requires approval. Please review the case details in the Cases for Approval section.', 0, '2025-09-08 11:19:36', '2025-09-08 11:19:36'),
(174, 5, NULL, NULL, 'case_for_approval', 'New Case for Approval', 'A new complaint (Case #2025011) has been filed and requires approval. Please review the case details in the Cases for Approval section.', 1, '2025-09-08 12:03:06', '2025-09-08 12:08:54'),
(175, 6, NULL, NULL, 'case_for_approval', 'New Case for Approval', 'A new complaint (Case #2025011) has been filed and requires approval. Please review the case details in the Cases for Approval section.', 0, '2025-09-08 12:03:06', '2025-09-08 12:03:06'),
(176, 5, NULL, NULL, 'case_for_approval', 'New Case for Approval', 'A new complaint (Case #2025012) has been filed and requires approval. Please review the case details in the Cases for Approval section.', 1, '2025-09-08 12:13:35', '2025-09-08 12:13:43'),
(177, 6, NULL, NULL, 'case_for_approval', 'New Case for Approval', 'A new complaint (Case #2025012) has been filed and requires approval. Please review the case details in the Cases for Approval section.', 0, '2025-09-08 12:13:35', '2025-09-08 12:13:35'),
(178, 5, NULL, NULL, 'case_for_approval', 'New Case for Approval', 'A new complaint (Case #2025013) has been filed and requires approval. Please review the case details in the Cases for Approval section.', 1, '2025-09-09 02:29:44', '2025-09-09 02:29:49'),
(179, 6, NULL, NULL, 'case_for_approval', 'New Case for Approval', 'A new complaint (Case #2025013) has been filed and requires approval. Please review the case details in the Cases for Approval section.', 0, '2025-09-09 02:29:44', '2025-09-09 02:29:44'),
(180, 5, NULL, NULL, 'case_for_approval', 'New Case for Approval', 'A new complaint (Case #2025014) has been filed and requires approval. Please review the case details in the Cases for Approval section.', 1, '2025-09-09 03:07:36', '2025-09-09 03:07:40'),
(181, 6, NULL, NULL, 'case_for_approval', 'New Case for Approval', 'A new complaint (Case #2025014) has been filed and requires approval. Please review the case details in the Cases for Approval section.', 0, '2025-09-09 03:07:36', '2025-09-09 03:07:36'),
(182, 5, NULL, NULL, 'case_for_approval', 'New Case for Approval', 'A new complaint (Case #2025015) has been filed and requires approval. Please review the case details in the Cases for Approval section.', 1, '2025-09-09 03:12:38', '2025-09-09 03:12:41'),
(183, 6, NULL, NULL, 'case_for_approval', 'New Case for Approval', 'A new complaint (Case #2025015) has been filed and requires approval. Please review the case details in the Cases for Approval section.', 0, '2025-09-09 03:12:38', '2025-09-09 03:12:38'),
(184, 5, NULL, NULL, 'case_for_approval', 'New Case for Approval', 'A new complaint (Case #2025016) has been filed and requires approval. Please review the case details in the Cases for Approval section.', 1, '2025-09-09 03:17:08', '2025-09-09 03:17:12'),
(185, 6, NULL, NULL, 'case_for_approval', 'New Case for Approval', 'A new complaint (Case #2025016) has been filed and requires approval. Please review the case details in the Cases for Approval section.', 0, '2025-09-09 03:17:08', '2025-09-09 03:17:08'),
(186, 5, NULL, NULL, 'case_for_approval', 'New Case for Approval', 'A new complaint (Case #2025017) has been filed and requires approval. Please review the case details in the Cases for Approval section.', 1, '2025-09-09 03:17:38', '2025-09-09 03:17:42'),
(187, 6, NULL, NULL, 'case_for_approval', 'New Case for Approval', 'A new complaint (Case #2025017) has been filed and requires approval. Please review the case details in the Cases for Approval section.', 0, '2025-09-09 03:17:38', '2025-09-09 03:17:38'),
(188, 5, NULL, NULL, 'case_for_approval', 'New Case for Approval', 'A new complaint (Case #2025018) has been filed and requires approval. Please review the case details in the Cases for Approval section.', 1, '2025-09-09 03:21:15', '2025-09-09 03:21:20'),
(189, 6, NULL, NULL, 'case_for_approval', 'New Case for Approval', 'A new complaint (Case #2025018) has been filed and requires approval. Please review the case details in the Cases for Approval section.', 0, '2025-09-09 03:21:15', '2025-09-09 03:21:15'),
(190, 5, NULL, NULL, 'case_for_approval', 'New Case for Approval', 'A new complaint (Case #2025019) has been filed and requires approval. Please review the case details in the Cases for Approval section.', 1, '2025-09-09 06:34:19', '2025-09-09 06:34:49'),
(191, 6, NULL, NULL, 'case_for_approval', 'New Case for Approval', 'A new complaint (Case #2025019) has been filed and requires approval. Please review the case details in the Cases for Approval section.', 0, '2025-09-09 06:34:19', '2025-09-09 06:34:19'),
(192, 5, NULL, NULL, 'case_for_approval', 'New Case for Approval', 'A new complaint (Case #2025020) has been filed and requires approval. Please review the case details in the Cases for Approval section.', 1, '2025-09-09 06:34:33', '2025-09-09 06:34:49'),
(193, 6, NULL, NULL, 'case_for_approval', 'New Case for Approval', 'A new complaint (Case #2025020) has been filed and requires approval. Please review the case details in the Cases for Approval section.', 0, '2025-09-09 06:34:33', '2025-09-09 06:34:33'),
(194, 5, NULL, NULL, 'case_for_approval', 'New Case for Approval', 'A new complaint (Case #2025021) has been filed and requires approval. Please review the case details in the Cases for Approval section.', 1, '2025-09-09 06:34:44', '2025-09-09 06:34:49'),
(195, 6, NULL, NULL, 'case_for_approval', 'New Case for Approval', 'A new complaint (Case #2025021) has been filed and requires approval. Please review the case details in the Cases for Approval section.', 0, '2025-09-09 06:34:44', '2025-09-09 06:34:44'),
(196, 5, NULL, NULL, 'case_for_approval', 'New Case for Approval', 'A new complaint (Case #2025022) has been filed and requires approval. Please review the case details in the Cases for Approval section.', 1, '2025-09-09 06:39:07', '2025-09-09 06:49:24'),
(197, 6, NULL, NULL, 'case_for_approval', 'New Case for Approval', 'A new complaint (Case #2025022) has been filed and requires approval. Please review the case details in the Cases for Approval section.', 0, '2025-09-09 06:39:07', '2025-09-09 06:39:07'),
(198, 5, NULL, NULL, 'case_for_approval', 'New Case for Approval', 'A new complaint (Case #2025023) has been filed and requires approval. Please review the case details in the Cases for Approval section.', 1, '2025-09-09 06:39:18', '2025-09-09 06:49:24'),
(199, 6, NULL, NULL, 'case_for_approval', 'New Case for Approval', 'A new complaint (Case #2025023) has been filed and requires approval. Please review the case details in the Cases for Approval section.', 0, '2025-09-09 06:39:18', '2025-09-09 06:39:18'),
(200, 5, NULL, NULL, 'case_for_approval', 'New Case for Approval', 'A new complaint (Case #2025024) has been filed and requires approval. Please review the case details in the Cases for Approval section.', 1, '2025-09-09 06:53:02', '2025-09-09 06:53:10'),
(201, 6, NULL, NULL, 'case_for_approval', 'New Case for Approval', 'A new complaint (Case #2025024) has been filed and requires approval. Please review the case details in the Cases for Approval section.', 0, '2025-09-09 06:53:02', '2025-09-09 06:53:02'),
(202, 5, NULL, NULL, 'case_for_approval', 'New Case for Approval', 'A new complaint (Case #2025025) has been filed and requires approval. Please review the case details in the Cases for Approval section.', 1, '2025-09-09 06:55:25', '2025-09-09 06:55:29'),
(203, 6, NULL, NULL, 'case_for_approval', 'New Case for Approval', 'A new complaint (Case #2025025) has been filed and requires approval. Please review the case details in the Cases for Approval section.', 0, '2025-09-09 06:55:25', '2025-09-09 06:55:25'),
(204, 5, NULL, NULL, 'case_for_approval', 'New Case for Approval', 'A new complaint (Case #2025026) has been filed and requires approval. Please review the case details in the Cases for Approval section.', 1, '2025-09-09 07:00:33', '2025-09-09 07:02:31'),
(205, 6, NULL, NULL, 'case_for_approval', 'New Case for Approval', 'A new complaint (Case #2025026) has been filed and requires approval. Please review the case details in the Cases for Approval section.', 0, '2025-09-09 07:00:33', '2025-09-09 07:00:33'),
(206, 5, NULL, NULL, 'case_for_approval', 'New Case for Approval', 'A new complaint (Case #2025027) has been filed and requires approval. Please review the case details in the Cases for Approval section.', 1, '2025-09-09 07:00:52', '2025-09-09 07:02:31'),
(207, 6, NULL, NULL, 'case_for_approval', 'New Case for Approval', 'A new complaint (Case #2025027) has been filed and requires approval. Please review the case details in the Cases for Approval section.', 0, '2025-09-09 07:00:52', '2025-09-09 07:00:52'),
(208, 11, NULL, NULL, 'mediation_scheduled', 'Mediation Scheduled', 'Your case \"Physical injuries inflicted by tumultuous affray\" has been scheduled for mediation. Please check your dashboard for details.', 1, '2025-09-09 07:02:45', '2025-09-11 13:55:47'),
(209, 11, NULL, NULL, 'arbitration_scheduled', 'Arbitration Scheduled', 'Your case \"Physical injuries inflicted by tumultuous affray\" has been scheduled for arbitration. Please check your dashboard for details.', 1, '2025-09-09 07:10:08', '2025-09-11 13:55:47'),
(210, 5, NULL, NULL, 'case_for_approval', 'New Case for Approval', 'A new complaint (Case #2025028) has been filed and requires approval. Please review the case details in the Cases for Approval section.', 1, '2025-09-09 07:59:28', '2025-09-09 08:01:22'),
(211, 6, NULL, NULL, 'case_for_approval', 'New Case for Approval', 'A new complaint (Case #2025028) has been filed and requires approval. Please review the case details in the Cases for Approval section.', 0, '2025-09-09 07:59:28', '2025-09-09 07:59:28'),
(212, 5, NULL, NULL, 'case_for_approval', 'New Case for Approval', 'A new complaint (Case #2025029) has been filed and requires approval. Please review the case details in the Cases for Approval section.', 1, '2025-09-09 07:59:39', '2025-09-09 08:01:22'),
(213, 6, NULL, NULL, 'case_for_approval', 'New Case for Approval', 'A new complaint (Case #2025029) has been filed and requires approval. Please review the case details in the Cases for Approval section.', 0, '2025-09-09 07:59:39', '2025-09-09 07:59:39'),
(214, 5, NULL, NULL, 'case_for_approval', 'New Case for Approval', 'A new complaint (Case #2025030) has been filed and requires approval. Please review the case details in the Cases for Approval section.', 1, '2025-09-09 07:59:48', '2025-09-09 08:01:22'),
(215, 6, NULL, NULL, 'case_for_approval', 'New Case for Approval', 'A new complaint (Case #2025030) has been filed and requires approval. Please review the case details in the Cases for Approval section.', 0, '2025-09-09 07:59:48', '2025-09-09 07:59:48'),
(216, 5, NULL, NULL, 'case_for_approval', 'New Case for Approval', 'A new complaint (Case #2025031) has been filed and requires approval. Please review the case details in the Cases for Approval section.', 1, '2025-09-09 07:59:59', '2025-09-09 08:01:22'),
(217, 6, NULL, NULL, 'case_for_approval', 'New Case for Approval', 'A new complaint (Case #2025031) has been filed and requires approval. Please review the case details in the Cases for Approval section.', 0, '2025-09-09 07:59:59', '2025-09-09 07:59:59'),
(218, 5, NULL, NULL, 'case_for_approval', 'New Case for Approval', 'A new complaint (Case #2025032) has been filed and requires approval. Please review the case details in the Cases for Approval section.', 1, '2025-09-09 08:23:29', '2025-09-09 08:23:57'),
(219, 6, NULL, NULL, 'case_for_approval', 'New Case for Approval', 'A new complaint (Case #2025032) has been filed and requires approval. Please review the case details in the Cases for Approval section.', 0, '2025-09-09 08:23:29', '2025-09-09 08:23:29'),
(220, 5, NULL, NULL, 'case_for_approval', 'New Case for Approval', 'A new complaint (Case #2025033) has been filed and requires approval. Please review the case details in the Cases for Approval section.', 1, '2025-09-09 08:23:38', '2025-09-09 08:23:57'),
(221, 6, NULL, NULL, 'case_for_approval', 'New Case for Approval', 'A new complaint (Case #2025033) has been filed and requires approval. Please review the case details in the Cases for Approval section.', 0, '2025-09-09 08:23:38', '2025-09-09 08:23:38'),
(222, 5, NULL, NULL, 'case_for_approval', 'New Case for Approval', 'A new complaint (Case #2025034) has been filed and requires approval. Please review the case details in the Cases for Approval section.', 1, '2025-09-09 08:27:27', '2025-09-09 08:27:32'),
(223, 6, NULL, NULL, 'case_for_approval', 'New Case for Approval', 'A new complaint (Case #2025034) has been filed and requires approval. Please review the case details in the Cases for Approval section.', 0, '2025-09-09 08:27:27', '2025-09-09 08:27:27'),
(224, 5, NULL, NULL, 'case_for_approval', 'New Case for Approval', 'A new complaint (Case #2025035) has been filed and requires approval. Please review the case details in the Cases for Approval section.', 1, '2025-09-09 08:28:05', '2025-09-09 08:28:10'),
(225, 6, NULL, NULL, 'case_for_approval', 'New Case for Approval', 'A new complaint (Case #2025035) has been filed and requires approval. Please review the case details in the Cases for Approval section.', 0, '2025-09-09 08:28:05', '2025-09-09 08:28:05'),
(226, 5, NULL, NULL, 'case_for_approval', 'New Case for Approval', 'A new complaint (Case #2025036) has been filed and requires approval. Please review the case details in the Cases for Approval section.', 1, '2025-09-09 08:35:23', '2025-09-09 08:35:47'),
(227, 6, NULL, NULL, 'case_for_approval', 'New Case for Approval', 'A new complaint (Case #2025036) has been filed and requires approval. Please review the case details in the Cases for Approval section.', 0, '2025-09-09 08:35:23', '2025-09-09 08:35:23'),
(228, 5, NULL, NULL, 'case_for_approval', 'New Case for Approval', 'A new complaint (Case #2025037) has been filed and requires approval. Please review the case details in the Cases for Approval section.', 1, '2025-09-09 08:35:33', '2025-09-09 08:35:47'),
(229, 6, NULL, NULL, 'case_for_approval', 'New Case for Approval', 'A new complaint (Case #2025037) has been filed and requires approval. Please review the case details in the Cases for Approval section.', 0, '2025-09-09 08:35:33', '2025-09-09 08:35:33'),
(230, 5, NULL, NULL, 'case_for_approval', 'New Case for Approval', 'A new complaint (Case #2025038) has been filed and requires approval. Please review the case details in the Cases for Approval section.', 1, '2025-09-09 08:35:44', '2025-09-09 08:35:47'),
(231, 6, NULL, NULL, 'case_for_approval', 'New Case for Approval', 'A new complaint (Case #2025038) has been filed and requires approval. Please review the case details in the Cases for Approval section.', 0, '2025-09-09 08:35:44', '2025-09-09 08:35:44'),
(232, 5, NULL, NULL, 'case_for_approval', 'New Case for Approval', 'A new complaint (Case #2025039) has been filed and requires approval. Please review the case details in the Cases for Approval section.', 1, '2025-09-09 09:15:49', '2025-09-09 09:15:57'),
(233, 6, NULL, NULL, 'case_for_approval', 'New Case for Approval', 'A new complaint (Case #2025039) has been filed and requires approval. Please review the case details in the Cases for Approval section.', 0, '2025-09-09 09:15:49', '2025-09-09 09:15:49'),
(234, 5, NULL, NULL, 'case_for_approval', 'New Case for Approval', 'A new complaint (Case #2025001) has been filed and requires approval. Please review the case details in the Cases for Approval section.', 1, '2025-09-09 09:27:24', '2025-09-09 09:30:48'),
(235, 6, NULL, NULL, 'case_for_approval', 'New Case for Approval', 'A new complaint (Case #2025001) has been filed and requires approval. Please review the case details in the Cases for Approval section.', 0, '2025-09-09 09:27:24', '2025-09-09 09:27:24'),
(236, 5, NULL, NULL, 'case_for_approval', 'New Case for Approval', 'A new complaint (Case #2025002) has been filed and requires approval. Please review the case details in the Cases for Approval section.', 1, '2025-09-09 09:27:39', '2025-09-09 09:30:48'),
(237, 6, NULL, NULL, 'case_for_approval', 'New Case for Approval', 'A new complaint (Case #2025002) has been filed and requires approval. Please review the case details in the Cases for Approval section.', 0, '2025-09-09 09:27:39', '2025-09-09 09:27:39'),
(238, 5, NULL, NULL, 'case_for_approval', 'New Case for Approval', 'A new complaint (Case #2025003) has been filed and requires approval. Please review the case details in the Cases for Approval section.', 1, '2025-09-09 09:31:09', '2025-09-09 09:31:34'),
(239, 6, NULL, NULL, 'case_for_approval', 'New Case for Approval', 'A new complaint (Case #2025003) has been filed and requires approval. Please review the case details in the Cases for Approval section.', 0, '2025-09-09 09:31:09', '2025-09-09 09:31:09'),
(240, 5, NULL, NULL, 'case_for_approval', 'New Case for Approval', 'A new complaint (Case #2025004) has been filed and requires approval. Please review the case details in the Cases for Approval section.', 1, '2025-09-09 09:32:01', '2025-09-09 09:32:07'),
(241, 6, NULL, NULL, 'case_for_approval', 'New Case for Approval', 'A new complaint (Case #2025004) has been filed and requires approval. Please review the case details in the Cases for Approval section.', 0, '2025-09-09 09:32:01', '2025-09-09 09:32:01'),
(242, 5, NULL, NULL, 'case_for_approval', 'New Case for Approval', 'A new complaint (Case #2025005) has been filed and requires approval. Please review the case details in the Cases for Approval section.', 1, '2025-09-09 09:55:13', '2025-09-09 13:54:13'),
(243, 6, NULL, NULL, 'case_for_approval', 'New Case for Approval', 'A new complaint (Case #2025005) has been filed and requires approval. Please review the case details in the Cases for Approval section.', 0, '2025-09-09 09:55:13', '2025-09-09 09:55:13'),
(244, 5, NULL, NULL, 'case_for_approval', 'New Case for Approval', 'A new complaint (Case #2025006) has been filed and requires approval. Please review the case details in the Cases for Approval section.', 1, '2025-09-10 06:55:37', '2025-09-10 06:55:41'),
(245, 6, NULL, NULL, 'case_for_approval', 'New Case for Approval', 'A new complaint (Case #2025006) has been filed and requires approval. Please review the case details in the Cases for Approval section.', 0, '2025-09-10 06:55:37', '2025-09-10 06:55:37'),
(246, 5, NULL, NULL, 'case_for_approval', 'New Case for Approval', 'A new complaint (Case #2025007) has been filed and requires approval. Please review the case details in the Cases for Approval section.', 1, '2025-09-10 07:02:21', '2025-09-10 07:02:24'),
(247, 6, NULL, NULL, 'case_for_approval', 'New Case for Approval', 'A new complaint (Case #2025007) has been filed and requires approval. Please review the case details in the Cases for Approval section.', 0, '2025-09-10 07:02:21', '2025-09-10 07:02:21');
INSERT INTO `notifications` (`id`, `user_id`, `complaint_id`, `referral_id`, `type`, `title`, `message`, `is_read`, `created_at`, `updated_at`) VALUES
(248, 5, NULL, NULL, 'case_for_approval', 'New Case for Approval', 'A new complaint (Case #2025008) has been filed and requires approval. Please review the case details in the Cases for Approval section.', 1, '2025-09-10 07:08:38', '2025-09-10 07:08:42'),
(249, 6, NULL, NULL, 'case_for_approval', 'New Case for Approval', 'A new complaint (Case #2025008) has been filed and requires approval. Please review the case details in the Cases for Approval section.', 0, '2025-09-10 07:08:38', '2025-09-10 07:08:38'),
(250, 5, NULL, NULL, 'case_for_approval', 'New Case for Approval', 'A new complaint (Case #2025009) has been filed and requires approval. Please review the case details in the Cases for Approval section.', 1, '2025-09-10 07:12:14', '2025-09-10 07:12:19'),
(251, 6, NULL, NULL, 'case_for_approval', 'New Case for Approval', 'A new complaint (Case #2025009) has been filed and requires approval. Please review the case details in the Cases for Approval section.', 0, '2025-09-10 07:12:14', '2025-09-10 07:12:14'),
(252, 5, NULL, NULL, 'case_for_approval', 'New Case for Approval', 'A new complaint (Case #2025010) has been filed and requires approval. Please review the case details in the Cases for Approval section.', 1, '2025-09-10 07:27:12', '2025-09-10 07:27:17'),
(253, 6, NULL, NULL, 'case_for_approval', 'New Case for Approval', 'A new complaint (Case #2025010) has been filed and requires approval. Please review the case details in the Cases for Approval section.', 0, '2025-09-10 07:27:12', '2025-09-10 07:27:12'),
(254, 5, NULL, NULL, 'case_for_approval', 'New Case for Approval', 'A new complaint (Case #2025011) has been filed and requires approval. Please review the case details in the Cases for Approval section.', 1, '2025-09-10 07:59:48', '2025-09-10 07:59:55'),
(255, 6, NULL, NULL, 'case_for_approval', 'New Case for Approval', 'A new complaint (Case #2025011) has been filed and requires approval. Please review the case details in the Cases for Approval section.', 0, '2025-09-10 07:59:48', '2025-09-10 07:59:48'),
(256, 5, 2025001, NULL, 'case_for_approval', 'New Case for Approval', 'A new complaint (Case #2025001) has been filed and requires approval. Please review the case details in the Cases for Approval section.', 1, '2025-09-10 08:22:57', '2025-09-10 08:23:22'),
(257, 6, 2025001, NULL, 'case_for_approval', 'New Case for Approval', 'A new complaint (Case #2025001) has been filed and requires approval. Please review the case details in the Cases for Approval section.', 0, '2025-09-10 08:22:57', '2025-09-10 08:22:57'),
(258, 5, 2025002, NULL, 'case_for_approval', 'New Case for Approval', 'A new complaint (Case #2025002) has been filed and requires approval. Please review the case details in the Cases for Approval section.', 1, '2025-09-10 08:23:07', '2025-09-10 08:23:22'),
(259, 6, 2025002, NULL, 'case_for_approval', 'New Case for Approval', 'A new complaint (Case #2025002) has been filed and requires approval. Please review the case details in the Cases for Approval section.', 0, '2025-09-10 08:23:07', '2025-09-10 08:23:07'),
(260, 5, 2025003, NULL, 'case_for_approval', 'New Case for Approval', 'A new complaint (Case #2025003) has been filed and requires approval. Please review the case details in the Cases for Approval section.', 1, '2025-09-10 08:23:18', '2025-09-10 08:23:22'),
(261, 6, 2025003, NULL, 'case_for_approval', 'New Case for Approval', 'A new complaint (Case #2025003) has been filed and requires approval. Please review the case details in the Cases for Approval section.', 0, '2025-09-10 08:23:19', '2025-09-10 08:23:19'),
(262, 5, 2025004, NULL, 'case_for_approval', 'New Case for Approval', 'A new complaint (Case #2025004) has been filed and requires approval. Please review the case details in the Cases for Approval section.', 1, '2025-09-10 08:51:16', '2025-09-10 08:51:22'),
(263, 6, 2025004, NULL, 'case_for_approval', 'New Case for Approval', 'A new complaint (Case #2025004) has been filed and requires approval. Please review the case details in the Cases for Approval section.', 0, '2025-09-10 08:51:16', '2025-09-10 08:51:16'),
(264, 5, 2025005, NULL, 'case_for_approval', 'New Case for Approval', 'A new complaint (Case #2025005) has been filed and requires approval. Please review the case details in the Cases for Approval section.', 1, '2025-09-10 08:53:02', '2025-09-10 08:53:06'),
(265, 6, 2025005, NULL, 'case_for_approval', 'New Case for Approval', 'A new complaint (Case #2025005) has been filed and requires approval. Please review the case details in the Cases for Approval section.', 0, '2025-09-10 08:53:02', '2025-09-10 08:53:02'),
(266, 5, 2025006, NULL, 'case_for_approval', 'New Case for Approval', 'A new complaint (Case #2025006) has been filed and requires approval. Please review the case details in the Cases for Approval section.', 1, '2025-09-10 09:00:32', '2025-09-10 09:00:36'),
(267, 6, 2025006, NULL, 'case_for_approval', 'New Case for Approval', 'A new complaint (Case #2025006) has been filed and requires approval. Please review the case details in the Cases for Approval section.', 0, '2025-09-10 09:00:32', '2025-09-10 09:00:32'),
(268, 5, 2025007, NULL, 'case_for_approval', 'New Case for Approval', 'A new complaint (Case #2025007) has been filed and requires approval. Please review the case details in the Cases for Approval section.', 1, '2025-09-10 09:02:12', '2025-09-10 09:02:15'),
(269, 6, 2025007, NULL, 'case_for_approval', 'New Case for Approval', 'A new complaint (Case #2025007) has been filed and requires approval. Please review the case details in the Cases for Approval section.', 0, '2025-09-10 09:02:12', '2025-09-10 09:02:12'),
(270, 5, 2025008, NULL, 'case_for_approval', 'New Case for Approval', 'A new complaint (Case #2025008) has been filed and requires approval. Please review the case details in the Cases for Approval section.', 1, '2025-09-10 09:03:06', '2025-09-10 09:03:11'),
(271, 6, 2025008, NULL, 'case_for_approval', 'New Case for Approval', 'A new complaint (Case #2025008) has been filed and requires approval. Please review the case details in the Cases for Approval section.', 0, '2025-09-10 09:03:06', '2025-09-10 09:03:06'),
(272, 5, 2025009, NULL, 'case_for_approval', 'New Case for Approval', 'A new complaint (Case #2025009) has been filed and requires approval. Please review the case details in the Cases for Approval section.', 1, '2025-09-10 09:04:53', '2025-09-10 09:04:56'),
(273, 6, 2025009, NULL, 'case_for_approval', 'New Case for Approval', 'A new complaint (Case #2025009) has been filed and requires approval. Please review the case details in the Cases for Approval section.', 0, '2025-09-10 09:04:53', '2025-09-10 09:04:53'),
(274, 5, 2025010, NULL, 'case_for_approval', 'New Case for Approval', 'A new complaint (Case #2025010) has been filed and requires approval. Please review the case details in the Cases for Approval section.', 1, '2025-09-11 06:36:03', '2025-09-11 06:36:07'),
(275, 6, 2025010, NULL, 'case_for_approval', 'New Case for Approval', 'A new complaint (Case #2025010) has been filed and requires approval. Please review the case details in the Cases for Approval section.', 0, '2025-09-11 06:36:03', '2025-09-11 06:36:03'),
(276, 11, 2025011, NULL, 'payment_pending', 'Payment Required - Case Under Review', 'Your complaint (Case #2025011) has been filed successfully. Since you selected onsite payment, your case is currently under review and pending payment. Please visit our office to complete the payment process to proceed with your case.', 1, '2025-09-11 13:56:21', '2025-09-11 13:56:24'),
(277, 5, 2025011, NULL, 'case_for_approval', 'New Case for Approval', 'A new complaint (Case #2025011) has been filed and requires approval. Please review the case details in the Cases for Approval section.', 1, '2025-09-11 13:56:21', '2025-09-11 14:10:06'),
(278, 6, 2025011, NULL, 'case_for_approval', 'New Case for Approval', 'A new complaint (Case #2025011) has been filed and requires approval. Please review the case details in the Cases for Approval section.', 0, '2025-09-11 13:56:21', '2025-09-11 13:56:21'),
(279, 5, 2025012, NULL, 'case_for_approval', 'New Case for Approval', 'A new complaint (Case #2025012) has been filed and requires approval. Please review the case details in the Cases for Approval section.', 1, '2025-09-11 14:10:28', '2025-09-11 14:10:32'),
(280, 6, 2025012, NULL, 'case_for_approval', 'New Case for Approval', 'A new complaint (Case #2025012) has been filed and requires approval. Please review the case details in the Cases for Approval section.', 0, '2025-09-11 14:10:28', '2025-09-11 14:10:28'),
(281, 5, 2025013, NULL, 'case_for_approval', 'New Case for Approval', 'A new complaint (Case #2025013) has been filed and requires approval. Please review the case details in the Cases for Approval section.', 1, '2025-09-11 14:10:51', '2025-09-11 14:10:55'),
(282, 6, 2025013, NULL, 'case_for_approval', 'New Case for Approval', 'A new complaint (Case #2025013) has been filed and requires approval. Please review the case details in the Cases for Approval section.', 0, '2025-09-11 14:10:51', '2025-09-11 14:10:51'),
(283, 11, 2025011, NULL, 'mediation_scheduled', 'Mediation Scheduled', 'Your case \"Physical injuries inflicted by tumultuous affray\" has been scheduled for mediation. Please check your dashboard for details.', 1, '2025-09-11 14:11:24', '2025-09-11 14:12:23'),
(284, 11, 2025011, NULL, 'case_settled', 'Case Settled', 'Your case \"Physical injuries inflicted by tumultuous affray\" has been successfully settled.', 1, '2025-09-11 14:12:14', '2025-09-11 14:12:23'),
(285, 11, 2025014, NULL, 'payment_pending', 'Payment Required - Case Under Review', 'Your complaint (Case #2025014) has been filed successfully. Since you selected onsite payment, your case is currently under review and pending payment. Please visit our office to complete the payment process to proceed with your case.', 1, '2025-09-11 14:12:49', '2025-09-11 14:12:53'),
(286, 5, 2025014, NULL, 'case_for_approval', 'New Case for Approval', 'A new complaint (Case #2025014) has been filed and requires approval. Please review the case details in the Cases for Approval section.', 1, '2025-09-11 14:12:49', '2025-09-11 14:13:09'),
(287, 6, 2025014, NULL, 'case_for_approval', 'New Case for Approval', 'A new complaint (Case #2025014) has been filed and requires approval. Please review the case details in the Cases for Approval section.', 0, '2025-09-11 14:12:49', '2025-09-11 14:12:49'),
(288, 11, 2025014, NULL, 'mediation_scheduled', 'Mediation Scheduled', 'Your case \"Light threats\" has been scheduled for mediation. Please check your dashboard for details.', 1, '2025-09-11 14:13:15', '2025-09-11 14:13:20'),
(289, 11, 2025014, NULL, 'session_rescheduled', 'Session Rescheduled', 'A session for your case \"Light threats\" has been rescheduled. Please check your dashboard for the new schedule.', 1, '2025-09-11 14:18:57', '2025-09-11 14:19:19'),
(290, 11, 2025014, NULL, 'case_settled', 'Case Settled', 'Your case \"Light threats\" has been successfully settled.', 1, '2025-09-11 14:19:15', '2025-09-11 14:19:19'),
(291, 14, 2025015, NULL, 'payment_pending', 'Payment Required - Case Under Review', 'Your complaint (Case #2025015) has been filed successfully. Since you selected onsite payment, your case is currently under review and pending payment. Please visit our office to complete the payment process to proceed with your case.', 1, '2025-09-11 14:21:14', '2025-09-11 14:21:18'),
(292, 5, 2025015, NULL, 'case_for_approval', 'New Case for Approval', 'A new complaint (Case #2025015) has been filed and requires approval. Please review the case details in the Cases for Approval section.', 1, '2025-09-11 14:21:15', '2025-09-11 14:21:25'),
(293, 6, 2025015, NULL, 'case_for_approval', 'New Case for Approval', 'A new complaint (Case #2025015) has been filed and requires approval. Please review the case details in the Cases for Approval section.', 0, '2025-09-11 14:21:15', '2025-09-11 14:21:15'),
(294, 14, 2025015, NULL, 'mediation_scheduled', 'Mediation Scheduled', 'Your case \"Abandoning a minor\" has been scheduled for mediation. Please check your dashboard for details.', 1, '2025-09-11 14:23:11', '2025-09-11 14:23:26'),
(295, 11, 2025015, NULL, 'mediation_scheduled', 'Mediation Scheduled', 'Your case \"Abandoning a minor\" has been scheduled for mediation. Please check your dashboard for details.', 1, '2025-09-11 14:23:11', '2025-09-14 14:50:56'),
(296, 11, 2025015, NULL, 'mediation_scheduled', 'Mediation Scheduled', 'Your case \"Abandoning a minor\" has been scheduled for mediation. Please check your dashboard for details.', 1, '2025-09-11 14:23:11', '2025-09-14 14:50:56'),
(297, 14, 2025015, NULL, 'case_settled', 'Case Settled', 'Your case \"Abandoning a minor\" has been successfully settled.', 1, '2025-09-11 14:23:45', '2025-09-11 14:23:56'),
(298, 11, 2025015, NULL, 'case_settled', 'Case Settled', 'Your case \"Abandoning a minor\" has been successfully settled.', 1, '2025-09-11 14:23:45', '2025-09-14 14:50:56'),
(299, 11, 2025015, NULL, 'case_settled', 'Case Settled', 'Your case \"Abandoning a minor\" has been successfully settled.', 1, '2025-09-11 14:23:45', '2025-09-14 14:50:56'),
(300, 14, 2025016, NULL, 'payment_pending', 'Payment Required - Case Under Review', 'Your complaint (Case #2025016) has been filed successfully. Since you selected onsite payment, your case is currently under review and pending payment. Please visit our office to complete the payment process to proceed with your case.', 1, '2025-09-11 14:28:02', '2025-09-11 14:28:07'),
(301, 5, 2025016, NULL, 'case_for_approval', 'New Case for Approval', 'A new complaint (Case #2025016) has been filed and requires approval. Please review the case details in the Cases for Approval section.', 1, '2025-09-11 14:28:02', '2025-09-14 13:45:35'),
(302, 6, 2025016, NULL, 'case_for_approval', 'New Case for Approval', 'A new complaint (Case #2025016) has been filed and requires approval. Please review the case details in the Cases for Approval section.', 0, '2025-09-11 14:28:02', '2025-09-11 14:28:02'),
(303, 14, 2025016, NULL, 'mediation_scheduled', 'Mediation Scheduled', 'Your case \"Giving assistance to suicide\" has been scheduled for mediation. Please check your dashboard for details.', 1, '2025-09-14 13:45:44', '2025-09-14 13:46:08'),
(304, 14, 2025016, NULL, 'case_settled', 'Case Settled', 'Your case \"Giving assistance to suicide\" has been successfully settled.', 1, '2025-09-14 13:46:21', '2025-09-14 13:46:27'),
(305, 14, 2025017, NULL, 'payment_pending', 'Payment Required - Case Under Review', 'Your complaint (Case #2025017) has been filed successfully. Since you selected onsite payment, your case is currently under review and pending payment. Please visit our office to complete the payment process to proceed with your case.', 1, '2025-09-14 14:19:21', '2025-09-14 14:19:27'),
(306, 5, 2025017, NULL, 'case_for_approval', 'New Case for Approval', 'A new complaint (Case #2025017) has been filed and requires approval. Please review the case details in the Cases for Approval section.', 1, '2025-09-14 14:19:21', '2025-09-14 14:19:32'),
(307, 6, 2025017, NULL, 'case_for_approval', 'New Case for Approval', 'A new complaint (Case #2025017) has been filed and requires approval. Please review the case details in the Cases for Approval section.', 0, '2025-09-14 14:19:21', '2025-09-14 14:19:21'),
(308, 14, 2025017, NULL, 'mediation_scheduled', 'Mediation Scheduled', 'Your case \"Less serious physical injuries\" has been scheduled for mediation. Please check your dashboard for details.', 1, '2025-09-14 14:20:16', '2025-09-14 14:20:32'),
(309, 14, 2025017, NULL, 'case_settled', 'Case Settled', 'Your case \"Less serious physical injuries\" has been successfully settled.', 1, '2025-09-14 14:20:25', '2025-09-14 14:20:32'),
(310, 5, NULL, NULL, 'case_for_approval', 'New Case for Approval', 'A new complaint (Case #2025018) has been filed and requires approval. Please review the case details in the Cases for Approval section.', 1, '2025-09-14 15:25:06', '2025-09-15 02:06:05'),
(311, 6, NULL, NULL, 'case_for_approval', 'New Case for Approval', 'A new complaint (Case #2025018) has been filed and requires approval. Please review the case details in the Cases for Approval section.', 0, '2025-09-14 15:25:06', '2025-09-14 15:25:06'),
(312, 5, 2025019, NULL, 'case_for_approval', 'New Case for Approval', 'A new complaint (Case #2025019) has been filed and requires approval. Please review the case details in the Cases for Approval section.', 1, '2025-09-15 02:03:38', '2025-09-15 02:06:05'),
(313, 6, 2025019, NULL, 'case_for_approval', 'New Case for Approval', 'A new complaint (Case #2025019) has been filed and requires approval. Please review the case details in the Cases for Approval section.', 0, '2025-09-15 02:03:38', '2025-09-15 02:03:38'),
(314, 11, 2025019, NULL, 'mediation_scheduled', 'Mediation Scheduled', 'Your case \"Giving assistance to suicide\" has been scheduled for mediation. Please check your dashboard for details.', 1, '2025-09-15 02:06:49', '2025-09-15 02:07:42'),
(315, 11, 2025019, NULL, 'case_settled', 'Case Settled', 'Your case \"Giving assistance to suicide\" has been successfully settled.', 1, '2025-09-15 02:07:38', '2025-09-15 02:07:42'),
(316, 5, 2025020, NULL, 'case_for_approval', 'New Case for Approval', 'A new complaint (Case #2025020) has been filed and requires approval. Please review the case details in the Cases for Approval section.', 1, '2025-09-15 02:08:07', '2025-09-15 02:12:21'),
(317, 6, 2025020, NULL, 'case_for_approval', 'New Case for Approval', 'A new complaint (Case #2025020) has been filed and requires approval. Please review the case details in the Cases for Approval section.', 0, '2025-09-15 02:08:07', '2025-09-15 02:08:07'),
(318, 11, 2025020, NULL, 'mediation_scheduled', 'Mediation Scheduled', 'Your case \"Giving assistance to suicide\" has been scheduled for mediation. Please check your dashboard for details.', 1, '2025-09-15 02:12:28', '2025-09-15 02:12:52'),
(319, 11, 2025020, NULL, 'case_settled', 'Case Settled', 'Your case \"Giving assistance to suicide\" has been successfully settled.', 1, '2025-09-15 02:12:45', '2025-09-15 02:12:52'),
(320, 5, 2025021, NULL, 'case_for_approval', 'New Case for Approval', 'A new complaint (Case #2025021) has been filed and requires approval. Please review the case details in the Cases for Approval section.', 1, '2025-09-15 02:13:08', '2025-09-15 02:38:18'),
(321, 6, 2025021, NULL, 'case_for_approval', 'New Case for Approval', 'A new complaint (Case #2025021) has been filed and requires approval. Please review the case details in the Cases for Approval section.', 0, '2025-09-15 02:13:08', '2025-09-15 02:13:08'),
(322, 11, 2025021, NULL, 'mediation_scheduled', 'Mediation Scheduled', 'Your case \"Less serious physical injuries\" has been scheduled for mediation. Please check your dashboard for details.', 1, '2025-09-15 02:38:31', '2025-09-15 03:08:58'),
(323, 11, 2025021, NULL, 'case_settled', 'Case Settled', 'Your case \"Less serious physical injuries\" has been successfully settled.', 1, '2025-09-15 02:38:41', '2025-09-15 03:08:58'),
(324, 11, NULL, NULL, 'payment_pending', 'Payment Required - Case Under Review', 'Your complaint (Case #2025022) has been filed successfully. Since you selected onsite payment, your case is currently under review and pending payment. Please visit our office to complete the payment process to proceed with your case.', 1, '2025-09-15 02:52:17', '2025-09-15 03:08:58'),
(325, 5, NULL, NULL, 'case_for_approval', 'New Case for Approval', 'A new complaint (Case #2025022) has been filed and requires approval. Please review the case details in the Cases for Approval section.', 1, '2025-09-15 02:52:17', '2025-09-15 02:52:30'),
(326, 6, NULL, NULL, 'case_for_approval', 'New Case for Approval', 'A new complaint (Case #2025022) has been filed and requires approval. Please review the case details in the Cases for Approval section.', 0, '2025-09-15 02:52:17', '2025-09-15 02:52:17'),
(327, 5, NULL, NULL, 'case_for_approval', 'New Case for Approval', 'A new complaint (Case #2025022) has been filed and requires approval. Please review the case details in the Cases for Approval section.', 1, '2025-09-15 03:28:27', '2025-09-15 03:28:50'),
(328, 6, NULL, NULL, 'case_for_approval', 'New Case for Approval', 'A new complaint (Case #2025022) has been filed and requires approval. Please review the case details in the Cases for Approval section.', 0, '2025-09-15 03:28:27', '2025-09-15 03:28:27'),
(329, 11, NULL, 33, 'case_transferred', 'Case Transferred', 'Your case \"Abandoning a minor\" has been transferred to sadsadasdasd for further processing. You may need to follow up directly with the receiving agency.', 1, '2025-09-15 03:29:00', '2025-09-15 03:32:31'),
(330, 5, NULL, NULL, 'case_for_approval', 'New Case for Approval', 'A new complaint (Case #2025022) has been filed and requires approval. Please review the case details in the Cases for Approval section.', 1, '2025-09-15 03:35:42', '2025-09-15 03:39:36'),
(331, 6, NULL, NULL, 'case_for_approval', 'New Case for Approval', 'A new complaint (Case #2025022) has been filed and requires approval. Please review the case details in the Cases for Approval section.', 0, '2025-09-15 03:35:42', '2025-09-15 03:35:42'),
(332, 11, NULL, 34, 'case_transferred', 'Case Transferred', 'Your case \"Physical injuries inflicted by tumultuous affray\" has been transferred to dsadsad for further processing. You may need to follow up directly with the receiving agency.', 1, '2025-09-15 03:36:18', '2025-09-15 03:36:23'),
(333, 5, NULL, NULL, 'case_for_approval', 'New Case for Approval', 'A new complaint (Case #2025022) has been filed and requires approval. Please review the case details in the Cases for Approval section.', 1, '2025-09-15 03:36:47', '2025-09-15 03:39:36'),
(334, 6, NULL, NULL, 'case_for_approval', 'New Case for Approval', 'A new complaint (Case #2025022) has been filed and requires approval. Please review the case details in the Cases for Approval section.', 0, '2025-09-15 03:36:47', '2025-09-15 03:36:47'),
(335, 11, NULL, 35, 'case_transferred', 'Case Transferred', 'Your case \"Abandonment of persons in danger and abandonment of one\'s own victim\" has been transferred to dsasdasd for further processing. You may need to follow up directly with the receiving agency.', 1, '2025-09-15 03:39:39', '2025-09-15 03:39:44'),
(336, 5, NULL, NULL, 'case_for_approval', 'New Case for Approval', 'A new complaint (Case #2025022) has been filed and requires approval. Please review the case details in the Cases for Approval section.', 1, '2025-09-15 05:21:13', '2025-09-15 09:58:24'),
(337, 6, NULL, NULL, 'case_for_approval', 'New Case for Approval', 'A new complaint (Case #2025022) has been filed and requires approval. Please review the case details in the Cases for Approval section.', 0, '2025-09-15 05:21:13', '2025-09-15 05:21:13'),
(338, 5, 2025022, NULL, 'case_for_approval', 'New Case for Approval', 'A new complaint (Case #2025022) has been filed and requires approval. Please review the case details in the Cases for Approval section.', 1, '2025-09-15 10:43:38', '2025-09-15 10:44:00'),
(339, 6, 2025022, NULL, 'case_for_approval', 'New Case for Approval', 'A new complaint (Case #2025022) has been filed and requires approval. Please review the case details in the Cases for Approval section.', 0, '2025-09-15 10:43:38', '2025-09-15 10:43:38'),
(340, 5, 2025023, NULL, 'case_for_approval', 'New Case for Approval', 'A new complaint (Case #2025023) has been filed and requires approval. Please review the case details in the Cases for Approval section.', 1, '2025-09-15 10:44:32', '2025-09-15 10:44:39'),
(341, 6, 2025023, NULL, 'case_for_approval', 'New Case for Approval', 'A new complaint (Case #2025023) has been filed and requires approval. Please review the case details in the Cases for Approval section.', 0, '2025-09-15 10:44:32', '2025-09-15 10:44:32'),
(342, 11, 2025022, NULL, 'mediation_scheduled', 'Mediation Scheduled', 'Your case \"Physical injuries inflicted by tumultuous affray\" has been scheduled for mediation. Please check your dashboard for details.', 1, '2025-09-15 10:45:49', '2025-09-15 10:45:53'),
(343, 11, 2025022, NULL, 'case_settled', 'Case Settled', 'Your case \"Physical injuries inflicted by tumultuous affray\" has been successfully settled.', 1, '2025-09-15 10:49:30', '2025-09-15 10:49:37'),
(344, 5, 2025024, NULL, 'case_for_approval', 'New Case for Approval', 'A new complaint (Case #2025024) has been filed and requires approval. Please review the case details in the Cases for Approval section.', 1, '2025-09-15 10:49:52', '2025-09-15 10:50:07'),
(345, 6, 2025024, NULL, 'case_for_approval', 'New Case for Approval', 'A new complaint (Case #2025024) has been filed and requires approval. Please review the case details in the Cases for Approval section.', 0, '2025-09-15 10:49:52', '2025-09-15 10:49:52'),
(346, 5, 2025025, NULL, 'case_for_approval', 'New Case for Approval', 'A new complaint (Case #2025025) has been filed and requires approval. Please review the case details in the Cases for Approval section.', 1, '2025-09-15 10:50:24', '2025-09-15 10:55:31'),
(347, 6, 2025025, NULL, 'case_for_approval', 'New Case for Approval', 'A new complaint (Case #2025025) has been filed and requires approval. Please review the case details in the Cases for Approval section.', 0, '2025-09-15 10:50:24', '2025-09-15 10:50:24'),
(348, 5, NULL, NULL, 'case_for_approval', 'New Case for Approval', 'A new complaint (Case #2025026) has been filed and requires approval. Please review the case details in the Cases for Approval section.', 1, '2025-09-15 10:53:09', '2025-09-15 10:55:31'),
(349, 6, NULL, NULL, 'case_for_approval', 'New Case for Approval', 'A new complaint (Case #2025026) has been filed and requires approval. Please review the case details in the Cases for Approval section.', 0, '2025-09-15 10:53:09', '2025-09-15 10:53:09'),
(350, 5, NULL, NULL, 'case_for_approval', 'New Case for Approval', 'A new complaint (Case #2025026) has been filed and requires approval. Please review the case details in the Cases for Approval section.', 1, '2025-09-15 10:56:06', '2025-09-15 10:57:49'),
(351, 6, NULL, NULL, 'case_for_approval', 'New Case for Approval', 'A new complaint (Case #2025026) has been filed and requires approval. Please review the case details in the Cases for Approval section.', 0, '2025-09-15 10:56:06', '2025-09-15 10:56:06'),
(352, 5, 2025026, NULL, 'case_for_approval', 'New Case for Approval', 'A new complaint (Case #2025026) has been filed and requires approval. Please review the case details in the Cases for Approval section.', 1, '2025-09-15 10:58:21', '2025-09-15 11:00:06'),
(353, 6, 2025026, NULL, 'case_for_approval', 'New Case for Approval', 'A new complaint (Case #2025026) has been filed and requires approval. Please review the case details in the Cases for Approval section.', 0, '2025-09-15 10:58:21', '2025-09-15 10:58:21'),
(354, 14, 2025026, NULL, 'mediation_scheduled', 'Mediation Scheduled', 'Your case \"Light threats\" has been scheduled for mediation. Please check your dashboard for details.', 1, '2025-09-15 13:25:10', '2025-09-15 13:25:16'),
(355, 5, 2025027, NULL, 'case_for_approval', 'New Case for Approval', 'A new complaint (Case #2025027) has been filed and requires approval. Please review the case details in the Cases for Approval section.', 1, '2025-09-16 04:24:08', '2025-09-16 04:24:12'),
(356, 6, 2025027, NULL, 'case_for_approval', 'New Case for Approval', 'A new complaint (Case #2025027) has been filed and requires approval. Please review the case details in the Cases for Approval section.', 0, '2025-09-16 04:24:08', '2025-09-16 04:24:08'),
(357, 5, NULL, NULL, 'case_for_approval', 'New Case for Approval', 'A new complaint (Case #2025028) has been filed and requires approval. Please review the case details in the Cases for Approval section.', 1, '2025-09-16 09:48:42', '2025-09-16 09:49:09'),
(358, 6, NULL, NULL, 'case_for_approval', 'New Case for Approval', 'A new complaint (Case #2025028) has been filed and requires approval. Please review the case details in the Cases for Approval section.', 0, '2025-09-16 09:48:42', '2025-09-16 09:48:42'),
(359, 5, NULL, NULL, 'case_for_approval', 'New Case for Approval', 'A new complaint (Case #2025029) has been filed and requires approval. Please review the case details in the Cases for Approval section.', 1, '2025-09-16 09:54:14', '2025-09-16 09:54:18'),
(360, 6, NULL, NULL, 'case_for_approval', 'New Case for Approval', 'A new complaint (Case #2025029) has been filed and requires approval. Please review the case details in the Cases for Approval section.', 0, '2025-09-16 09:54:14', '2025-09-16 09:54:14'),
(361, 5, 2025030, NULL, 'case_for_approval', 'New Case for Approval', 'A new complaint (Case #2025030) has been filed and requires approval. Please review the case details in the Cases for Approval section.', 1, '2025-09-16 10:01:14', '2025-09-16 10:01:18'),
(362, 6, 2025030, NULL, 'case_for_approval', 'New Case for Approval', 'A new complaint (Case #2025030) has been filed and requires approval. Please review the case details in the Cases for Approval section.', 0, '2025-09-16 10:01:14', '2025-09-16 10:01:14'),
(363, 5, NULL, NULL, 'case_for_approval', 'New Case for Approval', 'A new complaint (Case #2025031) has been filed and requires approval. Please review the case details in the Cases for Approval section.', 1, '2025-09-16 10:45:09', '2025-09-16 10:45:13'),
(364, 6, NULL, NULL, 'case_for_approval', 'New Case for Approval', 'A new complaint (Case #2025031) has been filed and requires approval. Please review the case details in the Cases for Approval section.', 0, '2025-09-16 10:45:09', '2025-09-16 10:45:09'),
(365, 5, 2025031, NULL, 'case_for_approval', 'New Case for Approval', 'A new complaint (Case #2025031) has been filed and requires approval. Please review the case details in the Cases for Approval section.', 1, '2025-09-16 11:10:07', '2025-09-16 11:10:11'),
(366, 6, 2025031, NULL, 'case_for_approval', 'New Case for Approval', 'A new complaint (Case #2025031) has been filed and requires approval. Please review the case details in the Cases for Approval section.', 0, '2025-09-16 11:10:07', '2025-09-16 11:10:07');

-- --------------------------------------------------------

--
-- Table structure for table `referrals`
--

CREATE TABLE `referrals` (
  `id` int(11) NOT NULL,
  `original_complaint_id` int(11) NOT NULL,
  `case_title` varchar(255) NOT NULL,
  `complainant_id` int(11) DEFAULT NULL,
  `respondent_id` int(11) DEFAULT NULL,
  `witness_id` int(11) DEFAULT NULL,
  `nature_of_complaint` text DEFAULT NULL,
  `referred_to` varchar(255) NOT NULL,
  `referral_reason` text NOT NULL,
  `referred_by` int(11) NOT NULL,
  `referral_date` timestamp NOT NULL DEFAULT current_timestamp(),
  `status` varchar(50) DEFAULT 'referred',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `referrals`
--

INSERT INTO `referrals` (`id`, `original_complaint_id`, `case_title`, `complainant_id`, `respondent_id`, `witness_id`, `nature_of_complaint`, `referred_to`, `referral_reason`, `referred_by`, `referral_date`, `status`, `created_at`, `updated_at`) VALUES
(32, 2025022, 'Light coercion', 14, 7, 14, 'liberty_security', 'dsadsadas', 'sadsadsad', 5, '2025-09-15 02:52:38', 'referred', '2025-09-15 02:52:38', '2025-09-15 02:52:38'),
(33, 2025022, 'Abandoning a minor', 14, 22, 22, 'liberty_security', 'sadsadasdasd', 'asdsadsadsda', 5, '2025-09-15 03:29:00', 'referred', '2025-09-15 03:29:00', '2025-09-15 03:29:00'),
(34, 2025022, 'Physical injuries inflicted by tumultuous affray', 1, 14, 14, 'persons', 'dsadsad', 'saasdsadsaasd', 5, '2025-09-15 03:36:18', 'referred', '2025-09-15 03:36:18', '2025-09-15 03:36:18'),
(35, 2025022, 'Abandonment of persons in danger and abandonment of one\'s own victim', 1, 7, 7, 'liberty_security', 'dsasdasd', 'adssdadsasda', 5, '2025-09-15 03:39:39', 'referred', '2025-09-15 03:39:39', '2025-09-15 03:39:39'),
(36, 2025022, 'Alarms and scandals', 14, 14, 10, 'public_interest', 'dsadsadsa', 'dsadsaasdsad', 5, '2025-09-15 10:43:20', 'referred', '2025-09-15 10:43:20', '2025-09-15 10:43:20'),
(37, 2025018, 'Using false certificate', 18, 10, 18, 'public_interest', 'dasdsadsa', 'sdasdaasdasd', 5, '2025-09-15 10:45:01', 'referred', '2025-09-15 10:45:01', '2025-09-15 10:45:01'),
(38, 2025026, 'Physical injuries inflicted by tumultuous affray', 9, 13, 14, 'persons', 'dsadsasda', 'sdasadsda', 5, '2025-09-15 10:55:45', 'referred', '2025-09-15 10:55:45', '2025-09-15 10:55:45'),
(39, 2025026, 'Giving assistance to suicide', 14, 18, 18, 'persons', 'dsasdasdsd', 'sadasdsasd', 5, '2025-09-15 10:57:55', 'referred', '2025-09-15 10:57:55', '2025-09-15 10:57:55'),
(40, 2025031, 'Giving assistance to suicide', NULL, NULL, NULL, 'persons', 'dsadassad', 'sdasdaasd', 5, '2025-09-16 11:05:50', 'referred', '2025-09-16 11:05:50', '2025-09-16 11:05:50'),
(41, 2025029, 'Abandoning a minor', NULL, NULL, NULL, 'liberty_security', 'sdadsa', 'sdasdasad', 5, '2025-09-16 11:05:59', 'referred', '2025-09-16 11:05:59', '2025-09-16 11:05:59'),
(42, 2025028, 'Giving assistance to suicide', NULL, NULL, NULL, 'persons', 'sdadsad', 'sasdasdasda', 5, '2025-09-16 11:06:04', 'referred', '2025-09-16 11:06:04', '2025-09-16 11:06:04');

-- --------------------------------------------------------

--
-- Table structure for table `residents`
--

CREATE TABLE `residents` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL DEFAULT '',
  `purok` varchar(100) DEFAULT NULL,
  `contact` varchar(100) DEFAULT NULL,
  `barangay` varchar(100) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `user_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `residents`
--

INSERT INTO `residents` (`id`, `name`, `purok`, `contact`, `barangay`, `created_at`, `user_id`) VALUES
(1, 'Jerald Ogahayon', 'ibabao', '09231799250', 'ibabao', '2025-07-26 05:21:43', 11),
(2, 'Nava Steven Son', 'kalabasa', '09231212', 'kalolo', '2025-07-26 05:23:10', NULL),
(3, 'Marvin Patalinghug', 'maampoon', '0561515151', 'ibabao', '2025-07-26 05:24:07', NULL),
(4, 'Ana Maria', 'paglaum', '09171504859', 'ibabao', '2025-07-26 05:51:01', NULL),
(5, 'Nestor Ogahayon', 'Paglaum', '09231799250', 'ibabao', '2025-07-26 05:51:23', NULL),
(6, 'Alma Lopez', 'paglaum', '09152634897', 'Ibabao', '2025-07-26 05:51:50', NULL),
(7, 'Lebron James', 'paglaum', '151511151515', 'ibabao', '2025-07-26 07:09:54', NULL),
(8, 'Clarence degamo', 'paglaum', '01474141414', 'ibabao', '2025-07-29 14:10:26', NULL),
(9, 'Jess Bae Riblora', 'paglaum', '5151515151', 'ibabao', '2025-07-29 14:10:46', NULL),
(10, 'Jera Erames', 'paglaum', '4848484848', 'Ibabao', '2025-07-29 14:14:16', NULL),
(11, 'Epe Erojo', 'Paglaum', '1515151515', 'Ibabao', '2025-07-29 14:14:46', NULL),
(12, 'Shaira Erojo', 'Paglaum', '4545454545', 'Ibabao', '2025-07-29 14:15:09', NULL),
(13, 'Jesryl Riblora', 'Paglaum', '09494184848', 'Ibabao', '2025-07-30 07:16:52', NULL),
(14, 'Jane Ogahayon', 'Paglaum', '4848484848484', 'Ibabao', '2025-07-30 07:30:12', NULL),
(15, 'Grace Ogahayon', 'Paglaum', '5959595959', 'Ibabao', '2025-07-30 07:30:40', NULL),
(16, 'Shane Loraine', 'Maampoon', '484848484', 'Ibabao', '2025-07-30 07:39:36', NULL),
(17, 'pedro ', 'kamonggay', '09123omgaygad', 'kahoy', '2025-08-01 09:38:20', NULL),
(18, 'jepoy canete', 'naga', '099876', 'pamungkas', '2025-08-01 09:39:01', NULL),
(19, 'Jhon Cena', 'Paglaum', '09499414084', 'Ibabao', '2025-08-06 03:54:33', NULL),
(20, 'Big Show', 'Paglaum', '09231499549', 'Ibabao', '2025-08-06 03:55:14', NULL),
(21, 'Rowena Cinco', 'Ibabao', '09231799250', 'Ibabao', '2025-08-06 12:37:47', NULL),
(22, 'Dexter Ogahayon', 'Paglaum', '095959', 'Ibabao', '2025-08-07 03:45:52', 11),
(23, 'Justine Riblora', 'Paglaum', '09231723215', 'Ibabao', '2025-08-11 09:05:19', NULL),
(24, 'Rowena Cinco', 'Paglaum', '094518487848', 'Ibabao', '2025-08-22 13:54:50', NULL),
(25, 'Dennis Tatoy', 'Paglaum', '0995959595', 'Ibabao', '2025-09-01 06:17:40', NULL),
(26, 'we ', 'wewe', 'wewe', 'wewe', '2025-09-09 09:31:55', NULL),
(27, '', 'dsaasd', 'asasdasd', 'sdadasasd', '2025-09-16 09:06:49', NULL),
(28, 'asdsa ', 'sdasaddsa', 'sadsadsad', 'sadsadsda', '2025-09-16 09:26:14', NULL),
(29, 'JEFFERSON JUSTOL HARBAY', 'PAGLAUM', '0923799250', 'IBABAO', '2025-09-16 09:36:42', NULL),
(30, 'marvin gwaps patalinghug', 'paglaum', '1515815151', 'ibabao', '2025-09-16 09:48:32', NULL),
(31, 'jerald fernandez ogahayon', 'paglaum', '09231799250', 'ibabao', '2025-09-16 10:44:54', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `settlement`
--

CREATE TABLE `settlement` (
  `id` int(11) NOT NULL,
  `complaint_id` int(11) NOT NULL,
  `settlement_type` enum('mediation','conciliation','arbitration') NOT NULL,
  `settlement_date` date NOT NULL,
  `agreements` text NOT NULL,
  `remarks` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `settlement`
--

INSERT INTO `settlement` (`id`, `complaint_id`, `settlement_type`, `settlement_date`, `agreements`, `remarks`, `created_at`, `updated_at`) VALUES
(40, 2025011, 'mediation', '2025-09-11', 'dsadsadadasdasd', 'sadasdasddsadadsa', '2025-09-11 14:12:14', '2025-09-11 14:12:14'),
(41, 2025014, 'mediation', '2025-09-11', 'dsadsasdasdasa', 'dsadsadsaadsda', '2025-09-11 14:19:15', '2025-09-11 14:19:15'),
(42, 2025010, 'mediation', '2025-09-11', 'adsadsadsa', 'dsadasdsadsa', '2025-09-11 14:23:21', '2025-09-11 14:23:21'),
(43, 2025015, 'mediation', '2025-09-11', 'dsadsadsaasd', 'sdasdadsadsasda', '2025-09-11 14:23:45', '2025-09-11 14:23:45'),
(44, 2025016, 'mediation', '2025-09-14', 'dsadasads', 'dadadasdasd', '2025-09-14 13:46:21', '2025-09-14 13:46:21'),
(45, 2025017, 'mediation', '2025-09-14', 'asdadsa', 'dasdsad', '2025-09-14 14:20:25', '2025-09-14 14:20:25'),
(46, 2025019, 'mediation', '2025-09-15', 'dsadasasdsad', 'sdaassasdaasd', '2025-09-15 02:07:38', '2025-09-15 02:07:38'),
(47, 2025020, 'mediation', '2025-09-15', 'dsadsasdadsasda', 'dassdaasdsadsda', '2025-09-15 02:12:45', '2025-09-15 02:12:45'),
(48, 2025021, 'mediation', '2025-09-15', 'asddassadsad', 'sdaasdasdsda', '2025-09-15 02:38:41', '2025-09-15 02:38:41'),
(49, 2025022, 'mediation', '2025-09-15', 'sdasdads', 'dsasdsasdaasd', '2025-09-15 10:49:30', '2025-09-15 10:49:30');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `last_name` varchar(50) NOT NULL,
  `first_name` varchar(50) NOT NULL,
  `middle_name` varchar(50) DEFAULT NULL,
  `email` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `birth_date` date NOT NULL,
  `gender` enum('male','female','other') NOT NULL,
  `purok` text NOT NULL DEFAULT '',
  `barangay` varchar(100) NOT NULL,
  `municipality` varchar(100) NOT NULL DEFAULT '',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `role` enum('admin','secretary','user') NOT NULL DEFAULT 'user'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `last_name`, `first_name`, `middle_name`, `email`, `password`, `birth_date`, `gender`, `purok`, `barangay`, `municipality`, `created_at`, `updated_at`, `role`) VALUES
(5, 'Administrator', 'System', '', 'administrator@lupon.com', '$2b$10$Qh.0jmxavTkrodeXKpyw9.ace6biEJSbTANnCQaV2a5bj84iErFYe', '2000-01-01', 'male', 'System Address', 'System Barangay', 'System City', '2025-06-17 04:52:16', '2025-09-02 06:40:03', 'admin'),
(6, 'Secretary', 'System', '', 'secretary2@lupon.com', '$2b$10$Qh.0jmxavTkrodeXKpyw9.NQXP8fQvAcRIADqpfHIVq5FyM9diiCm', '2000-01-01', 'female', 'System Address', 'System Barangay', 'System City', '2025-06-17 04:52:16', '2025-09-02 06:40:03', 'secretary'),
(11, 'Ogahayon', 'Dexter', 'Fernandez', 'dexter@gmail.com', '$2b$10$AafiU1B/P2jwxz8em1zlE.mGDHINTKMQ9fj.wChyE0xJ0VYeu6cm2', '2003-11-07', 'male', 'Lower Sunok Ibabao Cordoba', 'ibabao', 'Cordova', '2025-08-06 05:51:13', '2025-09-02 06:40:03', 'user'),
(12, 'harbay', 'jefferson', 'justol', 'jepo@gmail.com', '$2b$10$XzkPHdYwZuobEA230xL.VuNLpsUkOOJJ6vQbBNvMp0PWwbAQ1h80m', '2025-08-06', 'male', 'KANDIGAN, PILIPOG , CORDOVA , CEBU', 'ibabao', 'Cordova', '2025-08-06 06:20:31', '2025-09-02 06:40:03', 'user'),
(13, 'kabansay', 'pedro', '', 'pedrokabansay@gmail.com', '$2b$10$/sY5lvYRFplRXsw7BT2nNeF/A6bEDseDp5HaTQCUCYnUzdXIVoNs2', '2001-01-01', 'male', 'lower sun-ok', 'ibabao', ' cebu', '2025-08-08 07:17:18', '2025-09-02 06:40:03', 'user'),
(14, 'ogahayon', 'hehe', 'Fernandez', 'hehe@gmail.com', '$2b$10$ADFcVtqhYrt.QhANFuVSCeTe2bp/5xI..9UvHBB4WbFgvi1XiWfPi', '2025-08-18', 'male', 'lower sun-ok, ibabao, cordova, cebu', 'ibabao', 'cordova', '2025-08-18 07:55:35', '2025-09-02 06:40:03', 'user'),
(15, 'tatoy', 'dennis', 'bayalas', 'dennistatoy@gmail.com', '$2b$10$vy72bnwqyXCaA4geo5Af2OwqzJrTmSZf9qxWZTmA3Nqhvz9ZnFGi.', '2003-11-13', 'female', 'lower sun-ok, ibabao, cordova, cebu', 'ibabao', 'cordova', '2025-09-01 06:16:06', '2025-09-02 06:40:03', 'user'),
(16, 'wewe', 'w', 'we', 'wewew@Gmail.com', '$2b$10$Jp8dqaZaZx4iREgO4lO9WOxLToWE6XQA3c07vprg75ItDwFLXR3s.', '1999-02-22', 'male', 'we', 'weew', 'Cordova', '2025-09-02 06:42:20', '2025-09-02 06:42:20', 'user');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `arbitration`
--
ALTER TABLE `arbitration`
  ADD PRIMARY KEY (`id`),
  ADD KEY `complaint_id` (`complaint_id`);

--
-- Indexes for table `arbitration_documentation`
--
ALTER TABLE `arbitration_documentation`
  ADD PRIMARY KEY (`id`),
  ADD KEY `arbitration_id` (`arbitration_id`);

--
-- Indexes for table `arbitration_reschedule`
--
ALTER TABLE `arbitration_reschedule`
  ADD PRIMARY KEY (`id`),
  ADD KEY `arbitration_id` (`arbitration_id`);

--
-- Indexes for table `complaints`
--
ALTER TABLE `complaints`
  ADD PRIMARY KEY (`id`),
  ADD KEY `complainant_id` (`complainant_id`),
  ADD KEY `respondent_id` (`respondent_id`),
  ADD KEY `witness_id` (`witness_id`);

--
-- Indexes for table `conciliation`
--
ALTER TABLE `conciliation`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_conciliation_complaint` (`complaint_id`);

--
-- Indexes for table `conciliation_documentation`
--
ALTER TABLE `conciliation_documentation`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_conciliation_id` (`conciliation_id`);

--
-- Indexes for table `conciliation_reschedule`
--
ALTER TABLE `conciliation_reschedule`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_conciliation_id` (`conciliation_id`),
  ADD KEY `idx_reschedule_date` (`reschedule_date`);

--
-- Indexes for table `lupon_chairperson`
--
ALTER TABLE `lupon_chairperson`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `lupon_members`
--
ALTER TABLE `lupon_members`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `lupon_secretary`
--
ALTER TABLE `lupon_secretary`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `mediation`
--
ALTER TABLE `mediation`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_mediation_complaint` (`complaint_id`);

--
-- Indexes for table `mediation_documentation`
--
ALTER TABLE `mediation_documentation`
  ADD PRIMARY KEY (`id`),
  ADD KEY `mediation_id` (`mediation_id`);

--
-- Indexes for table `mediation_reschedule`
--
ALTER TABLE `mediation_reschedule`
  ADD PRIMARY KEY (`id`),
  ADD KEY `mediation_id` (`mediation_id`);

--
-- Indexes for table `notifications`
--
ALTER TABLE `notifications`
  ADD PRIMARY KEY (`id`),
  ADD KEY `referral_id` (`referral_id`),
  ADD KEY `idx_user_id` (`user_id`),
  ADD KEY `idx_user_read` (`user_id`,`is_read`),
  ADD KEY `idx_created_at` (`created_at`),
  ADD KEY `idx_complaint_id` (`complaint_id`),
  ADD KEY `idx_type` (`type`);

--
-- Indexes for table `referrals`
--
ALTER TABLE `referrals`
  ADD PRIMARY KEY (`id`),
  ADD KEY `complainant_id` (`complainant_id`),
  ADD KEY `respondent_id` (`respondent_id`),
  ADD KEY `witness_id` (`witness_id`),
  ADD KEY `referred_by` (`referred_by`);

--
-- Indexes for table `residents`
--
ALTER TABLE `residents`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `settlement`
--
ALTER TABLE `settlement`
  ADD PRIMARY KEY (`id`),
  ADD KEY `complaint_id` (`complaint_id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `arbitration`
--
ALTER TABLE `arbitration`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=56;

--
-- AUTO_INCREMENT for table `arbitration_documentation`
--
ALTER TABLE `arbitration_documentation`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `arbitration_reschedule`
--
ALTER TABLE `arbitration_reschedule`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=25;

--
-- AUTO_INCREMENT for table `conciliation`
--
ALTER TABLE `conciliation`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=33;

--
-- AUTO_INCREMENT for table `conciliation_documentation`
--
ALTER TABLE `conciliation_documentation`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `conciliation_reschedule`
--
ALTER TABLE `conciliation_reschedule`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=46;

--
-- AUTO_INCREMENT for table `lupon_chairperson`
--
ALTER TABLE `lupon_chairperson`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `lupon_members`
--
ALTER TABLE `lupon_members`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=18;

--
-- AUTO_INCREMENT for table `lupon_secretary`
--
ALTER TABLE `lupon_secretary`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `mediation`
--
ALTER TABLE `mediation`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=152;

--
-- AUTO_INCREMENT for table `mediation_documentation`
--
ALTER TABLE `mediation_documentation`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=26;

--
-- AUTO_INCREMENT for table `mediation_reschedule`
--
ALTER TABLE `mediation_reschedule`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=56;

--
-- AUTO_INCREMENT for table `notifications`
--
ALTER TABLE `notifications`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=367;

--
-- AUTO_INCREMENT for table `referrals`
--
ALTER TABLE `referrals`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=43;

--
-- AUTO_INCREMENT for table `residents`
--
ALTER TABLE `residents`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=32;

--
-- AUTO_INCREMENT for table `settlement`
--
ALTER TABLE `settlement`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=50;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=17;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `arbitration`
--
ALTER TABLE `arbitration`
  ADD CONSTRAINT `arbitration_ibfk_1` FOREIGN KEY (`complaint_id`) REFERENCES `complaints` (`id`);

--
-- Constraints for table `arbitration_documentation`
--
ALTER TABLE `arbitration_documentation`
  ADD CONSTRAINT `arbitration_documentation_ibfk_1` FOREIGN KEY (`arbitration_id`) REFERENCES `arbitration` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `arbitration_reschedule`
--
ALTER TABLE `arbitration_reschedule`
  ADD CONSTRAINT `arbitration_reschedule_ibfk_1` FOREIGN KEY (`arbitration_id`) REFERENCES `arbitration` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `complaints`
--
ALTER TABLE `complaints`
  ADD CONSTRAINT `complaints_ibfk_1` FOREIGN KEY (`complainant_id`) REFERENCES `residents` (`id`),
  ADD CONSTRAINT `complaints_ibfk_2` FOREIGN KEY (`respondent_id`) REFERENCES `residents` (`id`),
  ADD CONSTRAINT `complaints_ibfk_3` FOREIGN KEY (`witness_id`) REFERENCES `residents` (`id`);

--
-- Constraints for table `conciliation`
--
ALTER TABLE `conciliation`
  ADD CONSTRAINT `fk_conciliation_complaint` FOREIGN KEY (`complaint_id`) REFERENCES `complaints` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `conciliation_documentation`
--
ALTER TABLE `conciliation_documentation`
  ADD CONSTRAINT `conciliation_documentation_ibfk_1` FOREIGN KEY (`conciliation_id`) REFERENCES `conciliation` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `conciliation_reschedule`
--
ALTER TABLE `conciliation_reschedule`
  ADD CONSTRAINT `conciliation_reschedule_ibfk_1` FOREIGN KEY (`conciliation_id`) REFERENCES `conciliation` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `mediation`
--
ALTER TABLE `mediation`
  ADD CONSTRAINT `fk_mediation_complaint` FOREIGN KEY (`complaint_id`) REFERENCES `complaints` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `mediation_documentation`
--
ALTER TABLE `mediation_documentation`
  ADD CONSTRAINT `mediation_documentation_ibfk_1` FOREIGN KEY (`mediation_id`) REFERENCES `mediation` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `mediation_reschedule`
--
ALTER TABLE `mediation_reschedule`
  ADD CONSTRAINT `mediation_reschedule_ibfk_1` FOREIGN KEY (`mediation_id`) REFERENCES `mediation` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `notifications`
--
ALTER TABLE `notifications`
  ADD CONSTRAINT `notifications_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `notifications_ibfk_2` FOREIGN KEY (`complaint_id`) REFERENCES `complaints` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `notifications_ibfk_3` FOREIGN KEY (`referral_id`) REFERENCES `referrals` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `referrals`
--
ALTER TABLE `referrals`
  ADD CONSTRAINT `referrals_ibfk_1` FOREIGN KEY (`complainant_id`) REFERENCES `residents` (`id`),
  ADD CONSTRAINT `referrals_ibfk_2` FOREIGN KEY (`respondent_id`) REFERENCES `residents` (`id`),
  ADD CONSTRAINT `referrals_ibfk_3` FOREIGN KEY (`witness_id`) REFERENCES `residents` (`id`),
  ADD CONSTRAINT `referrals_ibfk_4` FOREIGN KEY (`referred_by`) REFERENCES `users` (`id`);

--
-- Constraints for table `residents`
--
ALTER TABLE `residents`
  ADD CONSTRAINT `residents_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`);

--
-- Constraints for table `settlement`
--
ALTER TABLE `settlement`
  ADD CONSTRAINT `settlement_ibfk_1` FOREIGN KEY (`complaint_id`) REFERENCES `complaints` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
