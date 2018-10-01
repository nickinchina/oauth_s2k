--DROP TABLE [hq].[oauth_clients]
CREATE TABLE [hq].[oauth_clients] (
	client_id nvarchar(500) NOT NULL,
	client_secret nvarchar(500) NOT NULL,
	redirect_uri nvarchar(500) NOT NULL,
	CONSTRAINT [pk_oauth_clients] PRIMARY KEY NONCLUSTERED (client_id,client_secret)
) WITH ( MEMORY_OPTIMIZED = ON, DURABILITY = SCHEMA_AND_DATA )
GO
--DROP TABLE [hq].[oauth_tokens]
CREATE TABLE [hq].[oauth_tokens] (
	id uniqueidentifier NOT NULL,
	access_token nvarchar(500) NOT NULL,
	access_token_expires_on datetime NOT NULL,
	client_id nvarchar(500) NOT NULL,
	refresh_token nvarchar(500) NOT NULL,
	refresh_token_expires_on datetime NOT NULL,
	user_id int NOT NULL,
	CONSTRAINT [pk_oauth_tokens] PRIMARY KEY NONCLUSTERED (id)
) WITH ( MEMORY_OPTIMIZED = ON, DURABILITY = SCHEMA_AND_DATA )
GO
