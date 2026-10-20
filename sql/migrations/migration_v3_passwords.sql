-- =====================================================================
-- ForenSight Database Migration: Phase 3 - Secure Password Hashing
-- Target Database: forensight
-- =====================================================================
USE `forensight`;

UPDATE users SET password_hash = 'scrypt:32768:8:1$bAA2GKsw5HOCfuV7$543257f09803f0fd06207137d464391cf3ee16c65598c3d748cb9412a98a326950bc368d022343ed15e229d711d23c3691f30dabdeea2a4ee68ad9a3c632d8e7' WHERE user_id = 1;
UPDATE users SET password_hash = 'scrypt:32768:8:1$SHiMKBBMlyqk8t9j$72a630a5f06a8f6a0494111ad9b97108c3c54eea514636349006e3a7de08cd963f6934e88bbd57d261d6f903787cda4c77fd0a2d72eb872d6d310806088e2be7' WHERE user_id = 2;
UPDATE users SET password_hash = 'scrypt:32768:8:1$jGAOOQgv9eR1kISW$d83da30ef13e77ccf68f84a69998990c81784a73bb94877ffe913698a9a202ffad68b14714577489e1e8d61ea6a4e2d45c3ccc492015728816cd5ad7b956f79d' WHERE user_id = 3;
UPDATE users SET password_hash = 'scrypt:32768:8:1$ooLUhtA2HHvnFqkV$6939a3d2809c9c58eb6c279146c37f40592d9ab50b7e51a6b54ba2101f0551598697c6c3974d6cd6e6250e632b1cbcb107b80680cca60efc971dd48ae34f8dc9' WHERE user_id = 4;
UPDATE users SET password_hash = 'scrypt:32768:8:1$BKFHKA86ptOt2CXs$465e26589b87df82c49b16e0fd7dbf187c95098e564449c8c981b51d8204ab3942eaba525c4c28623d5d1cad826e3f0bad20b0bb16fcec79e393f5d7e5a2e4c6' WHERE user_id = 5;
