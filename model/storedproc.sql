--DROP PROCEDURE [hq].[sp_oauth_get_token]
CREATE OR ALTER PROCEDURE [hq].[sp_oauth_get_token]
	@token nvarchar(500),
	@type tinyint=0
AS
BEGIN
	SELECT access_token, access_token_expires_on, client_id, refresh_token, refresh_token_expires_on, user_id
	  FROM hq.oauth_tokens 
	 WHERE (access_token=@token AND @type=0) 
		OR (refresh_token=@token AND @type=1);
END
GO
--DROP PROCEDURE [hq].[sp_oauth_get_client]
CREATE OR ALTER PROCEDURE [hq].[sp_oauth_get_client]
	@client_id nvarchar(500),
	@client_secret nvarchar(500)
AS
BEGIN
	SELECT client_id, client_secret, redirect_uri
	  FROM hq.oauth_clients 
	 WHERE client_id=@client_id AND client_secret=@client_secret;
END
GO
--DROP PROCEDURE [hq].[sp_oauth_get_user]
CREATE OR ALTER PROCEDURE [hq].[sp_oauth_get_user]
	@username nvarchar(100),
	@password nvarchar(100)
AS
BEGIN
	SELECT id FROM hq.pz_user WHERE name=@username AND password=@password;
END
GO
--DROP PROCEDURE [hq].[sp_oauth_save_token]
CREATE OR ALTER PROCEDURE [hq].[sp_oauth_save_token]
	@access_token nvarchar(500),
	@access_token_expires_on datetime,
	@client_id nvarchar(500),
	@refresh_token nvarchar(500),
	@refresh_token_expires_on datetime,
	@user_id int
AS
BEGIN
	INSERT INTO [hq].[oauth_tokens](
		[id],
		[access_token],
		[access_token_expires_on],
		[client_id],
		[refresh_token],
		[refresh_token_expires_on],
		[user_id])
	OUTPUT inserted.id
	 VALUES
		(NEWID(),
		@access_token,
		@access_token_expires_on,
		@client_id,
		@refresh_token,
		@refresh_token_expires_on,
		@user_id);
END
GO
