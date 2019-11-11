CREATE TABLE users (
    userID							INT NOT NULL AUTO_INCREMENT,
    fName							CHAR (255),
    lName							CHAR (255),
    email							CHAR (255),
    userPassword					CHAR (255),
    tokenExpiration					CHAR (255),
    tokenString						CHAR (64),
    dob								CHAR (255),
    verified						BOOL,
    latestVerificationCode			CHAR (4),
    PRIMARY KEY (userID)
);