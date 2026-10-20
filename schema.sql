create database forensic_db;
use forensic_db;
select database();

-- table 1: users
create table users (
    user_id int auto_increment primary key,
    name varchar(100) not null,
    email varchar(150) not null unique,
    password_hash varchar(255) not null,
    role enum('Admin', 'Investigator', 'Viewer')
        not null default 'Investigator',
    created_at timestamp default current_timestamp
);

-- table 2: cases
create table cases (
    case_id int auto_increment primary key,
    title varchar(200) not null,
    incident_type varchar(100) not null,
    description text,
    priority enum('Low', 'Medium', 'High', 'Critical')
        not null default 'Medium',
    status enum('Open', 'In Progress', 'Closed')
        not null default 'Open',
    created_by int not null,
    created_at timestamp default current_timestamp,
    updated_at timestamp default current_timestamp
        on update current_timestamp,
    foreign key (created_by) references users(user_id)
);

-- table 3: evidence
create table evidence (
    evidence_id int auto_increment primary key,
    case_id int not null,
    evidence_name varchar(255) not null,
    evidence_type varchar(50) not null,
    file_path varchar(500) not null,
    sha256_hash char(64) not null,
    file_size bigint unsigned not null,
    collected_at datetime,
    status enum('Registered', 'Under Review', 'Verified', 'Archived')
        not null default 'Registered',
    uploaded_by int not null,
    created_at timestamp default current_timestamp,
    foreign key (case_id) references cases(case_id),
    foreign key (uploaded_by) references users(user_id)
);

-- table 4: custodylogs
create table custodylogs (
    log_id int auto_increment primary key,
    evidence_id int not null,
    user_id int not null,
    action varchar(100) not null,
    notes text,
    event_time timestamp default current_timestamp,
    foreign key (evidence_id) references evidence(evidence_id),
    foreign key (user_id) references users(user_id)
);

-- table 5: analysisfindings
create table analysisfindings (
    finding_id int auto_increment primary key,
    evidence_id int not null,
    finding_type varchar(100) not null,
    severity enum('Low', 'Medium', 'High', 'Critical')
        not null default 'Low',
    description text not null,
    created_at timestamp default current_timestamp,
    foreign key (evidence_id) references evidence(evidence_id)
);

-- table 6: investigationtasks
create table investigationtasks (
    task_id int auto_increment primary key,
    case_id int not null,
    assigned_to int not null,
    task_title varchar(200) not null,
    description text,
    due_date date,
    status enum('Pending', 'In Progress', 'Completed')
        not null default 'Pending',
    created_at timestamp default current_timestamp,
    foreign key (case_id) references cases(case_id),
    foreign key (assigned_to) references users(user_id)
);

-- table 7: evidencenotes
create table evidencenotes (
    note_id int auto_increment primary key,
    evidence_id int not null,
    user_id int not null,
    note_text text not null,
    created_at timestamp default current_timestamp,
    foreign key (evidence_id) references evidence(evidence_id),
    foreign key (user_id) references users(user_id)
);

-- table 8: auditlogs
create table auditlogs (
    audit_id bigint auto_increment primary key,
    user_id int null,
    action varchar(100) not null,
    entity_type varchar(100) not null,
    entity_id int,
    details text,
    created_at timestamp default current_timestamp,
    foreign key (user_id) references users(user_id)
        on delete set null
);

-- verify table creation
show tables;